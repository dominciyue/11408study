package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.StatsOverviewDTO;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "学习统计", description = "学习数据统计和分析")
@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "学习概览统计")
    @GetMapping("/overview")
    public ApiResponse<StatsOverviewDTO> getOverview(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(statsService.getOverviewV2(userId));
    }

    @Operation(summary = "每日学习统计")
    @GetMapping("/daily")
    public ApiResponse<List<Map<String, Object>>> getDailyStats(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(statsService.getDailyStats(userId));
    }

    @Operation(summary = "薄弱知识点分析")
    @GetMapping("/weakness")
    public ApiResponse<Map<String, Object>> getWeakness(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(statsService.getWeaknessAnalysis(userId));
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
