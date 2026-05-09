package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsOverviewDTO {
    private Long totalNodes;
    private Long studiedNodes;
    private Long masteredNodes;
    private Double averageMastery;
    private Long totalStudyMinutes;

    private Long studiedToday;
    private Long reviewedToday;
    private Long studyTimeTodayMinutes;
    private Integer streakDays;

    private List<Long> weeklyStudyTimeMinutes; // last 7 days, oldest -> newest
    private List<SubjectProgressDTO> subjectProgress;

    // Feature 2 — 游戏化卡片（基于既有数据派生，无新表）
    private List<BadgeDTO> badges;
    private List<DailyTaskDTO> dailyTasks;
}

