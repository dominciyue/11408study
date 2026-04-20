package com.study11408.service;

import com.study11408.dto.QuizSubmitRequest;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.User;
import com.study11408.entity.WrongAnswer;
import com.study11408.exception.BusinessException;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizQuestionRepository questionRepository;
    private final WrongAnswerRepository wrongAnswerRepository;
    private final UserRepository userRepository;
    private final AiClientService aiClientService;

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

    public List<WrongAnswer> getWrongAnswers(Long userId) {
        return wrongAnswerRepository.findByUserIdAndResolvedFalse(userId);
    }
}
