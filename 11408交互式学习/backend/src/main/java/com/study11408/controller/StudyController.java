package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.KnowledgeNodeDTO;
import com.study11408.dto.StudyFeedbackRequest;
import com.study11408.entity.StudyProgress;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.StudyPathService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "学习系统", description = "学习路径、复习队列、学习反馈")
@RestController
@RequestMapping("/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyPathService studyPathService;
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

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
