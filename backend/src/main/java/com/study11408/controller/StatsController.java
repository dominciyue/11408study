package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.StatsOverviewDTO;
import com.study11408.dto.WeaknessRadarResponse;
import com.study11408.dto.WeeklyReportDTO;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.StatsService;
import com.study11408.service.WeeklyReportService;
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
    private final WeeklyReportService weeklyReportService;
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

    @Operation(summary = "弱点雷达图 — Subject 4 轴 mastery + Top 10 弱 Topic")
    @GetMapping("/weakness-radar")
    public ApiResponse<WeaknessRadarResponse> getWeaknessRadar(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(statsService.getWeaknessRadar(userId));
    }

    @Operation(summary = "本周学习周报")
    @GetMapping("/weekly-report")
    public ApiResponse<WeeklyReportDTO> weeklyReport(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ApiResponse.ok(weeklyReportService.build(userId));
    }

    @Operation(summary = "每学科可练题数 — 区分 inline / external，用于 quiz 主页 banner")
    @GetMapping("/subject-question-counts")
    public ApiResponse<List<Map<String, Object>>> getSubjectQuestionCounts() {
        return ApiResponse.ok(statsService.getSubjectQuestionCounts());
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
