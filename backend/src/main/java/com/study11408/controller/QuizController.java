package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.QuizAiExplainRequest;
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

    @Operation(summary = "自适应组卷（按应复习→低掌握→未学优先）")
    @PostMapping("/adaptive-generate")
    public ApiResponse<List<QuizQuestion>> adaptiveGenerate(
            HttpServletRequest request,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(defaultValue = "10") int count) {
        Long userId = getUserId(request);
        return ApiResponse.ok(quizService.adaptiveGenerate(userId, subjectId, count));
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

    @Operation(summary = "标记错题为已解决（幂等）")
    @PutMapping("/wrong-answers/{wrongAnswerId}/resolve")
    public ApiResponse<WrongAnswerDTO> resolveWrongAnswer(
            HttpServletRequest request,
            @PathVariable Long wrongAnswerId) {
        Long userId = getUserId(request);
        return ApiResponse.ok(quizService.markWrongAnswerResolved(userId, wrongAnswerId));
    }

    @Operation(summary = "AI 启发式讲题")
    @PostMapping("/{questionId}/ai-explain")
    public ApiResponse<Map<String, Object>> aiExplain(
            HttpServletRequest request,
            @PathVariable Long questionId,
            @Valid @RequestBody QuizAiExplainRequest body) {
        Long userId = getUserId(request);
        return ApiResponse.ok(quizService.explainWithAi(userId, questionId, body));
    }

    @Operation(summary = "为节点批量生成 AI 题目并落库")
    @PostMapping("/nodes/{nodeId}/generate-questions")
    public ApiResponse<Map<String, Object>> generateForNode(
            HttpServletRequest request,
            @PathVariable Long nodeId,
            @RequestParam(defaultValue = "5") int count,
            @RequestParam(defaultValue = "CHOICE") String type,
            @RequestParam(required = false) String difficulty) {
        // auth 由 Spring Security 兜底
        getUserId(request);
        return ApiResponse.ok(quizService.generateAndSaveForNode(nodeId, count, type, difficulty));
    }

    @Operation(summary = "为整个学科批量生成 AI 题目（admin 补题库）")
    @PostMapping("/subjects/{subjectId}/seed-questions")
    public ApiResponse<Map<String, Object>> seedSubject(
            HttpServletRequest request,
            @PathVariable Long subjectId,
            @RequestParam(defaultValue = "5") int countPerNode,
            @RequestParam(defaultValue = "CHOICE") String type,
            @RequestParam(defaultValue = "10") int maxNodes,
            @RequestParam(defaultValue = "true") boolean skipExisting) {
        getUserId(request);
        return ApiResponse.ok(quizService.seedSubjectQuestions(
                subjectId, countPerNode, type, maxNodes, skipExisting));
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
