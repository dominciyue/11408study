package com.study11408.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.QuizAiExplainRequest;
import com.study11408.dto.QuizSubmitRequest;
import com.study11408.dto.WrongAnswerDTO;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.User;
import com.study11408.entity.WrongAnswer;
import com.study11408.exception.BusinessException;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizQuestionRepository questionRepository;
    private final WrongAnswerRepository wrongAnswerRepository;
    private final UserRepository userRepository;
    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper;

    public List<QuizQuestion> generateQuiz(List<Long> nodeIds, int count) {
        List<QuizQuestion> questions = questionRepository.findRandomByNodeIds(nodeIds, count);
        if (questions.isEmpty()) {
            return questions;
        }
        return questions;
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
