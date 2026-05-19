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
    /** 近 365 天内的最长连续学习天数(含 currentStreak)。用于"突破历史最长"成就感反馈。 */
    private Integer longestStreakDays;
    /** 最近 14 天的逐日活动(oldest -> newest);每位 true=当日有学习。前端用作 mini 火焰条。 */
    private List<Boolean> recentActivityDays;

    private List<Long> weeklyStudyTimeMinutes; // last 7 days, oldest -> newest
    private List<SubjectProgressDTO> subjectProgress;

    // Feature 2 — 游戏化卡片（基于既有数据派生，无新表）
    private List<BadgeDTO> badges;
    private List<DailyTaskDTO> dailyTasks;
}

