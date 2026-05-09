package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.QuizSubmitRequest;
import com.study11408.dto.WrongAnswerDTO;
import com.study11408.entity.QuizQuestion;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "测验系统", description = "智能组卷、答题、错题本")
@RestController
@RequestMapping("/quiz")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "智能组卷")
    @PostMapping("/generate")
    public ApiResponse<List<QuizQuestion>> generateQuiz(
            @RequestParam List<Long> nodeIds,
            @RequestParam(defaultValue = "10") int count) {
        return ApiResponse.ok(quizService.generateQuiz(nodeIds, count));
    }

    @Operation(summary = "提交答案")
    @PostMapping("/submit")
    public ApiResponse<Map<String, Object>> submitAnswer(
            HttpServletRequest request,
            @Valid @RequestBody QuizSubmitRequest submitRequest) {
        Long userId = getUserId(request);
        return ApiResponse.ok(quizService.submitAnswer(userId, submitRequest));
    }

    @Operation(summary = "获取错题本")
    @GetMapping("/wrong-answers")
    public ApiResponse<List<WrongAnswerDTO>> getWrongAnswers(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(quizService.getWrongAnswers(userId));
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
