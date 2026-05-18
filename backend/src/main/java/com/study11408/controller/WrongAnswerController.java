package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.SimilarQuestionsResponse;
import com.study11408.dto.WrongAnswerDTO;
import com.study11408.dto.WrongAnswerGroupDTO;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.WrongAnswerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 错题闭环 controller — 错题本聚合 / 相似题 / 标记已掌握。
 *
 * <p>所有方法都在 service 层做 ownership 校验（findByIdAndUserId），
 * 越权访问返回 BusinessException(NOT_FOUND/FORBIDDEN)，由 GlobalExceptionHandler 转 4xx。
 */
@Tag(name = "错题闭环", description = "错题本聚合查询、相似题推送、标记已掌握")
@RestController
@RequestMapping("/wrong-answers")
@RequiredArgsConstructor
public class WrongAnswerController {

    private final WrongAnswerService wrongAnswerService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "错题本（按 node 聚合）")
    @GetMapping
    public ApiResponse<List<WrongAnswerGroupDTO>> listGrouped(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(wrongAnswerService.listGroupedByNode(userId));
    }

    @Operation(summary = "拉取相似题（同 node → topic → subject → AI 兜底）")
    @GetMapping("/{id}/similar")
    public ApiResponse<SimilarQuestionsResponse> similar(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit) {
        Long userId = getUserId(request);
        return ApiResponse.ok(wrongAnswerService.findSimilar(userId, id, limit));
    }

    @Operation(summary = "标记某条错题已掌握")
    @PostMapping("/{id}/resolve")
    public ApiResponse<WrongAnswerDTO> resolve(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = getUserId(request);
        return ApiResponse.ok(wrongAnswerService.resolve(userId, id));
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
