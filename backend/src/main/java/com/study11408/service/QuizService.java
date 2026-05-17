package com.study11408.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.QuizAiExplainRequest;
import com.study11408.dto.QuizQuestionDTO;
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

    private static final java.util.Set<String> ALLOWED_QUIZ_TYPES =
            java.util.Set.of("CHOICE", "TRUE_FALSE", "FILL_BLANK");

    /**
     * 调用 ai-service /ai/generate-quiz 为指定节点生成 N 道题并落库。
     * 用户调用前需通过 Spring Security auth；本方法本身不做用户权限收紧
     * （任何登录用户都可以为公共节点生成题目，扩充题库）。
     *
     * <p>error 兼容：ai-service 返回 {error:...} 或非预期格式时，返回
     * {generated:0, error:"..."}，不抛异常（前端友好提示）。
     */
    @Transactional
    public Map<String, Object> generateAndSaveForNode(
            Long nodeId, int count, String questionType, String difficulty) {
        // 入参校验抛 400，区别于运行时失败（AI 无响应等）的 success+error 软失败。
        if (count <= 0) {
            throw new BusinessException("count 必须 > 0", HttpStatus.BAD_REQUEST);
        }
        if (count > 20) count = 20;  // ai-service 上限即 20
        String type = (questionType == null ? "CHOICE" : questionType.toUpperCase());
        if (!ALLOWED_QUIZ_TYPES.contains(type)) {
            throw new BusinessException(
                    "questionType 必须是 CHOICE / TRUE_FALSE / FILL_BLANK",
                    HttpStatus.BAD_REQUEST);
        }

        KnowledgeNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
        String title = node.getTitle();
        String content = node.getContent() != null ? node.getContent() : "";

        Map<String, Object> aiResp = aiClientService.generateQuiz(title, content, type, count, difficulty);
        if (aiResp == null || aiResp.containsKey("error")) {
            String err = aiResp == null ? "AI 无响应" : String.valueOf(aiResp.get("error"));
            return Map.of("generated", 0, "error", err);
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rawQuestions = (List<Map<String, Object>>) aiResp.get("questions");
        if (rawQuestions == null || rawQuestions.isEmpty()) {
            return Map.of("generated", 0, "error", "AI 未生成任何题目");
        }

        int saved = 0;
        for (Map<String, Object> q : rawQuestions) {
            try {
                QuizQuestion entity = buildQuizEntity(node, type, q);
                if (entity != null) {
                    questionRepository.save(entity);
                    saved++;
                }
            } catch (Exception e) {
                log.warn("保存 AI 生成题目失败 (跳过): {}", q, e);
            }
        }

        log.info("AI 为节点 {} ({}) 生成并保存 {} 道 {} 题", nodeId, title, saved, type);
        return Map.of("generated", saved, "questionType", type, "nodeId", nodeId);
    }

    private QuizQuestion buildQuizEntity(KnowledgeNode node, String type, Map<String, Object> q) {
        String contentStr = stringOrNull(q.get("question"));
        String answer = stringOrNull(q.get("answer"));
        String explanation = stringOrNull(q.get("explanation"));
        if (contentStr == null || answer == null) {
            return null;
        }
        Object opts = q.get("options");
        String optsJson = null;
        if (opts != null) {
            try {
                optsJson = objectMapper.writeValueAsString(opts);
            } catch (Exception e) {
                log.warn("序列化 options 失败: {}", opts, e);
            }
        }
        return QuizQuestion.builder()
                .node(node)
                .questionType(type)
                .content(contentStr)
                .options(optsJson)
                .answer(answer)
                .explanation(explanation)
                .source("ai-generated")
                .build();
    }

    private static String stringOrNull(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    /**
     * 批量为某个学科下的节点生成题目（admin 用例：补全题库）。
     * 循环调 {@link #generateAndSaveForNode}，每节点失败不中断整批。
     *
     * <p><b>限制：</b>maxNodes 上限保护防 LLM 雪崩。一次最多处理 maxNodes 个节点；
     * 用户需要更多则多次调用。每节点 LLM ~10s，maxNodes=10 时一次约 100s。
     *
     * @param subjectId       目标学科
     * @param countPerNode    每节点生成多少题（1-20）
     * @param questionType    CHOICE / TRUE_FALSE / FILL_BLANK
     * @param maxNodes        本次最多处理的节点数（1-50；上限保护）
     * @param skipExisting    若节点已有任何题目则跳过；默认 true
     * @return 处理摘要
     */
    public Map<String, Object> seedSubjectQuestions(
            Long subjectId,
            int countPerNode,
            String questionType,
            int maxNodes,
            boolean skipExisting) {
        if (countPerNode <= 0 || countPerNode > 20) {
            throw new BusinessException(
                    "countPerNode 必须在 1-20 之间", HttpStatus.BAD_REQUEST);
        }
        if (maxNodes <= 0 || maxNodes > 50) {
            throw new BusinessException(
                    "maxNodes 必须在 1-50 之间（防 LLM 雪崩）", HttpStatus.BAD_REQUEST);
        }
        String type = (questionType == null ? "CHOICE" : questionType.toUpperCase());
        if (!ALLOWED_QUIZ_TYPES.contains(type)) {
            throw new BusinessException(
                    "questionType 必须是 CHOICE / TRUE_FALSE / FILL_BLANK",
                    HttpStatus.BAD_REQUEST);
        }

        long startMs = System.currentTimeMillis();
        List<KnowledgeNode> allNodes = nodeRepository.findByTopicSubjectId(subjectId);
        if (allNodes.isEmpty()) {
            return Map.of(
                    "subjectId", subjectId,
                    "totalNodes", 0,
                    "processed", 0,
                    "skipped", 0,
                    "succeeded", 0,
                    "failed", 0,
                    "totalQuestionsGenerated", 0,
                    "durationMs", 0L);
        }

        int processed = 0, skipped = 0, succeeded = 0, failed = 0, totalGenerated = 0;
        for (KnowledgeNode node : allNodes) {
            if (processed >= maxNodes) break;
            if (skipExisting && !questionRepository.findByNodeId(node.getId()).isEmpty()) {
                skipped++;
                continue;
            }
            processed++;
            try {
                Map<String, Object> r = generateAndSaveForNode(
                        node.getId(), countPerNode, type, null);
                Object generatedObj = r.get("generated");
                int generated = generatedObj instanceof Number
                        ? ((Number) generatedObj).intValue() : 0;
                if (generated > 0) {
                    succeeded++;
                    totalGenerated += generated;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                failed++;
                log.warn("seedSubjectQuestions: 节点 {} 生成失败 (跳过)", node.getId(), e);
            }
        }

        long duration = System.currentTimeMillis() - startMs;
        log.info(
                "seedSubjectQuestions subject={} processed={} skipped={} succeeded={} failed={} questions={} duration={}ms",
                subjectId, processed, skipped, succeeded, failed, totalGenerated, duration);

        Map<String, Object> result = new HashMap<>();
        result.put("subjectId", subjectId);
        result.put("totalNodes", allNodes.size());
        result.put("processed", processed);
        result.put("skipped", skipped);
        result.put("succeeded", succeeded);
        result.put("failed", failed);
        result.put("totalQuestionsGenerated", totalGenerated);
        result.put("durationMs", duration);
        return result;
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

        // 用 Objects.equals 避免 question.answer 为 null 时 NPE 500
        boolean correct = java.util.Objects.equals(question.getAnswer(), request.getUserAnswer());

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

    /**
     * 标记错题为已解决（用户在错题本上点 ✓）。带 ownership 校验。
     */
    @Transactional
    public WrongAnswerDTO markWrongAnswerResolved(Long userId, Long wrongAnswerId) {
        WrongAnswer w = wrongAnswerRepository.findByIdAndUserId(wrongAnswerId, userId)
                .orElseThrow(() -> new BusinessException("错题不存在或无权限", HttpStatus.NOT_FOUND));
        if (Boolean.TRUE.equals(w.getResolved())) {
            return toWrongAnswerDTO(w);  // 幂等：已解决则直接返回
        }
        w.setResolved(true);
        wrongAnswerRepository.save(w);
        return toWrongAnswerDTO(w);
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

    /**
     * QuizQuestion entity → DTO，用于需要把 link-based 字段独立出来的场景。
     * 现有 controller 仍可直接返回 entity（@Data 自动 getter，Jackson 序列化字段名一致），
     * 该方法供未来 controller 切换 / 单元测试使用。
     */
    public QuizQuestionDTO toQuizQuestionDTO(QuizQuestion q) {
        if (q == null) return null;
        QuizQuestionDTO dto = new QuizQuestionDTO();
        dto.setId(q.getId());
        dto.setNodeId(q.getNodeId());
        dto.setQuestionType(q.getQuestionType());
        dto.setContent(q.getContent());
        dto.setOptions(q.getOptions());
        dto.setAnswer(q.getAnswer());
        dto.setExplanation(q.getExplanation());
        dto.setSource(q.getSource());
        dto.setExternalUrl(q.getExternalUrl());
        dto.setExternalSource(q.getExternalSource());
        dto.setYear(q.getYear());
        dto.setQuestionNumber(q.getQuestionNumber());
        dto.setCreatedAt(q.getCreatedAt());
        return dto;
    }

    private WrongAnswerDTO toWrongAnswerDTO(WrongAnswer wrongAnswer) {
        QuizQuestion q = wrongAnswer.getQuestion();
        KnowledgeNode n = (q != null) ? q.getNode() : null;
        String topicName = null;
        String nodeTitle = null;
        if (n != null) {
            nodeTitle = n.getTitle();
            if (n.getTopic() != null) {
                topicName = n.getTopic().getName();
            }
        }
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
                .topicName(topicName)
                .nodeTitle(nodeTitle)
                .build();
    }
}
