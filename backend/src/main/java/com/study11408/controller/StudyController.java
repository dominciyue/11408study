package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.KnowledgeNodeDTO;
import com.study11408.dto.StartStudySessionRequest;
import com.study11408.dto.StudyFeedbackRequest;
import com.study11408.dto.StudyPlanRequest;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.StudySession;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.StudyPathService;
import com.study11408.service.StudySessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "学习系统", description = "学习路径、复习队列、学习反馈")
@RestController
@RequestMapping("/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyPathService studyPathService;
    private final StudySessionService studySessionService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "生成学科学习路径")
    @GetMapping("/path/{subjectId}")
    public ApiResponse<List<KnowledgeNodeDTO>> getStudyPath(@PathVariable Long subjectId) {
        return ApiResponse.ok(studyPathService.generatePath(subjectId));
    }

    @Operation(summary = "获取今日复习队列")
    @GetMapping("/review-queue")
    public ApiResponse<List<KnowledgeNodeDTO>> getReviewQueue(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(studyPathService.getReviewQueue(userId));
    }

    @Operation(summary = "提交学习反馈")
    @PostMapping("/feedback")
    public ApiResponse<Void> submitFeedback(
            HttpServletRequest request,
            @Valid @RequestBody StudyFeedbackRequest feedback) {
        Long userId = getUserId(request);
        studyPathService.processFeedback(userId, feedback.getNodeId(), feedback.getRating());
        return ApiResponse.ok();
    }

    @Operation(summary = "获取用户学习进度")
    @GetMapping("/progress")
    public ApiResponse<List<StudyProgress>> getProgress(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(studyPathService.getUserProgress(userId));
    }

    @Operation(summary = "获取单个知识点学习进度")
    @GetMapping("/progress/{nodeId}")
    public ApiResponse<StudyProgress> getNodeProgress(
            HttpServletRequest request,
            @PathVariable Long nodeId) {
        Long userId = getUserId(request);
        return ApiResponse.ok(studyPathService.getNodeProgress(userId, nodeId));
    }

    @Operation(summary = "开始学习会话")
    @PostMapping("/sessions")
    public ApiResponse<StudySession> startSession(
            HttpServletRequest request,
            @Valid @RequestBody StartStudySessionRequest body) {
        Long userId = getUserId(request);
        return ApiResponse.ok(studySessionService.startSession(userId, body));
    }

    @Operation(summary = "结束学习会话")
    @PutMapping("/sessions/{sessionId}/end")
    public ApiResponse<StudySession> endSession(
            HttpServletRequest request,
            @PathVariable Long sessionId) {
        Long userId = getUserId(request);
        return ApiResponse.ok(studySessionService.endSession(userId, sessionId));
    }

    @Operation(summary = "AI 生成分周学习计划",
            description = "根据用户目标 + 周数 + 薄弱主题，调用 ai-service "
                    + "生成 N 周学习计划。返回原始 ai-service 响应（plan 数组 + summary）。")
    @PostMapping("/ai-plan")
    public ApiResponse<Map<String, Object>> generateAiPlan(
            HttpServletRequest request,
            @Valid @RequestBody StudyPlanRequest body) {
        Long userId = getUserId(request);
        return ApiResponse.ok(studyPathService.generateAiPlan(userId, body));
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
