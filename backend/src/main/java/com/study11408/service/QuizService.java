package com.study11408.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.QuizAiExplainRequest;
import com.study11408.dto.QuizSubmitRequest;
import com.study11408.dto.WrongAnswerDTO;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.User;
import com.study11408.entity.WrongAnswer;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizQuestionRepository questionRepository;
    private final WrongAnswerRepository wrongAnswerRepository;
    private final UserRepository userRepository;
    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper;
    private final StudyProgressRepository progressRepository;
    private final KnowledgeNodeRepository nodeRepository;

    public List<QuizQuestion> generateQuiz(List<Long> nodeIds, int count) {
        List<QuizQuestion> questions = questionRepository.findRandomByNodeIds(nodeIds, count);
        if (questions.isEmpty()) {
            return questions;
        }
        return questions;
    }

    /**
     * 自适应组卷：按"应复习 → 低掌握 → 未学"三段优先级挑出节点，
     * 再随机抽 count 道题。无新表，仅用既有 study_progress + 题库。
     *
     * <p>若 subjectId 为 null：仅从用户已有进度池里挑（不补"未学新题"）。
     * <p>若候选 < count：返回少于 count 道（不报错，前端可提示）。
     */
    public List<QuizQuestion> adaptiveGenerate(Long userId, Long subjectId, int count) {
        if (count <= 0) return List.of();
        if (!userRepository.existsById(userId)) {
            throw new BusinessException("用户不存在", HttpStatus.NOT_FOUND);
        }

        List<StudyProgress> allProgress = progressRepository.findByUserIdWithNodeSubject(userId);
        List<StudyProgress> subjectProgress = subjectId == null
                ? allProgress
                : allProgress.stream()
                        .filter(p -> p.getNode() != null
                                && p.getNode().getTopic() != null
                                && p.getNode().getTopic().getSubject() != null
                                && subjectId.equals(p.getNode().getTopic().getSubject().getId()))
                        .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        // Bucket A: 应复习（next_review <= now），按到期最早排前
        List<Long> bucketA = subjectProgress.stream()
                .filter(p -> p.getNextReview() != null && !p.getNextReview().isAfter(now))
                .sorted(Comparator.comparing(StudyProgress::getNextReview))
                .map(StudyProgress::getNodeId)
                .collect(Collectors.toList());

        // Bucket B: 低掌握（mastery < 50，且不在 A 中），按掌握度升序
        Set<Long> aSet = new HashSet<>(bucketA);
        List<Long> bucketB = subjectProgress.stream()
                .filter(p -> p.getMasteryLevel() != null && p.getMasteryLevel() < 50)
                .filter(p -> !aSet.contains(p.getNodeId()))
                .sorted(Comparator.comparing(StudyProgress::getMasteryLevel))
                .map(StudyProgress::getNodeId)
                .collect(Collectors.toList());

        // Bucket C: 未学新节点（仅 subjectId 非空时填充）
        List<Long> bucketC = new ArrayList<>();
        if (subjectId != null) {
            Set<Long> studied = subjectProgress.stream()
                    .map(StudyProgress::getNodeId)
                    .collect(Collectors.toSet());
            bucketC = nodeRepository.findByTopicSubjectId(subjectId).stream()
                    .filter(n -> !studied.contains(n.getId()))
                    .map(KnowledgeNode::getId)
                    .collect(Collectors.toList());
        }

        LinkedHashSet<Long> selectedIds = new LinkedHashSet<>();
        selectedIds.addAll(bucketA);
        selectedIds.addAll(bucketB);
        selectedIds.addAll(bucketC);
        if (selectedIds.isEmpty()) return List.of();

        List<Long> finalIds = new ArrayList<>(selectedIds);
        // 上限保护：避免 SQL IN 列表过大；count*3 通常足以让随机分布合理
        int cap = Math.max(count * 3, count);
        if (finalIds.size() > cap) {
            finalIds = finalIds.subList(0, cap);
        }
        log.info("AdaptiveGenerate userId={} subject={} buckets A={}/B={}/C={} -> finalIds={} count={}",
                userId, subjectId, bucketA.size(), bucketB.size(), bucketC.size(),
                finalIds.size(), count);
        return questionRepository.findRandomByNodeIds(finalIds, count);
    }

    @Transactional
    public Map<String, Object> submitAnswer(Long userId, QuizSubmitRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));
        QuizQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new BusinessException("题目不存在", HttpStatus.NOT_FOUND));

        boolean correct = question.getAnswer().equals(request.getUserAnswer());

        Map<String, Object> result = new HashMap<>();
        result.put("correct", correct);
        result.put("correctAnswer", question.getAnswer());
        result.put("explanation", question.getExplanation());

        if (!correct) {
            WrongAnswer wrongAnswer = WrongAnswer.builder()
                    .user(user)
                    .question(question)
                    .userAnswer(request.getUserAnswer())
                    .answeredAt(LocalDateTime.now())
                    .resolved(false)
                    .build();
            wrongAnswerRepository.save(wrongAnswer);
        }

        return result;
    }

    public List<WrongAnswerDTO> getWrongAnswers(Long userId) {
        return wrongAnswerRepository.findByUserIdAndResolvedFalse(userId).stream()
                .map(this::toWrongAnswerDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> explainWithAi(Long userId, Long questionId, QuizAiExplainRequest req) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException("用户不存在", HttpStatus.NOT_FOUND);
        }
        QuizQuestion q = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException("题目不存在", HttpStatus.NOT_FOUND));

        Map<String, Object> question = new HashMap<>();
        question.put("content", q.getContent());
        question.put("correct_answer", q.getAnswer());
        question.put(
                "question_type",
                q.getQuestionType() != null ? q.getQuestionType() : "CHOICE");
        if (q.getExplanation() != null && !q.getExplanation().isBlank()) {
            question.put("stored_explanation", q.getExplanation());
        }
        if (q.getOptions() != null && !q.getOptions().isBlank()) {
            List<String> opts = parseOptions(q.getOptions());
            if (!opts.isEmpty()) {
                question.put("options", opts);
            }
        }

        Map<String, Object> nodeCtx = null;
        KnowledgeNode node = q.getNode();
        if (node != null) {
            Map<String, Object> ctx = new HashMap<>();
            ctx.put("title", node.getTitle());
            if (node.getContent() != null) {
                ctx.put("content", node.getContent());
            }
            nodeCtx = ctx;
        }

        List<Map<String, String>> historyList = null;
        if (req.getHistory() != null && !req.getHistory().isEmpty()) {
            historyList = req.getHistory().stream()
                    .map(h -> Map.of("role", h.getRole(), "content", h.getContent()))
                    .toList();
        }

        return aiClientService.explainQuestion(
                question, req.getUserAnswer(), nodeCtx, historyList);
    }

    private List<String> parseOptions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("解析题目 options JSON 失败: {}", json, e);
            return List.of();
        }
    }

    private WrongAnswerDTO toWrongAnswerDTO(WrongAnswer wrongAnswer) {
        QuizQuestion q = wrongAnswer.getQuestion();
        return WrongAnswerDTO.builder()
                .id(wrongAnswer.getId())
                .questionId(wrongAnswer.getQuestionId())
                .nodeId(q != null ? q.getNodeId() : null)
                .questionText(q != null ? q.getContent() : null)
                .userAnswer(wrongAnswer.getUserAnswer())
                .correctAnswer(q != null ? q.getAnswer() : null)
                .explanation(q != null ? q.getExplanation() : null)
                .answeredAt(wrongAnswer.getAnsweredAt())
                .resolved(wrongAnswer.getResolved())
                .build();
    }
}
