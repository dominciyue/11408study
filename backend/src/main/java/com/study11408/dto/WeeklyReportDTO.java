package com.study11408.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * 本周学习周报 — 派生自既有 sessions / progress / wrongs 数据，无新表。
 *
 * <p>"本周" = 过去 7 天的滚动窗口（今天 - 6 ~ 今天，按 ZoneId.systemDefault()）。
 * <p>{@link #dailyMinutes} 长度恒为 7，下标 0 = 最早一天，下标 6 = 今天。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReportDTO {

    /** 窗口起点（今天 - 6），ISO yyyy-MM-dd。 */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate weekStart;

    /** 窗口终点（今天），ISO yyyy-MM-dd。 */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate weekEnd;

    /** 本周累计学习分钟（仅算 endTime 非空的 session）。 */
    private Long totalMinutes;

    /** 本周有任何学习活动的天数，0-7。 */
    private Integer daysActive;

    /** 本周累计新学节点数（sum sessions.studiedNodes）。 */
    private Long studiedNodesThisWeek;

    /** 本周累计复习节点数（sum sessions.reviewedNodes）。 */
    private Long reviewedNodesThisWeek;

    /** 每日分钟数，长度恒为 7，下标 0 = 最早一天，下标 6 = 今天。 */
    private List<Long> dailyMinutes;

    /** 当前连续学习天数（复用 StatsService 算法）。 */
    private Integer streakDays;

    /** 弱主题 top 5（mastery&lt;50 节点的 topic name 出现次数 desc）。 */
    private List<String> topWeakTopics;

    /** 当前已解锁徽章数。 */
    private Integer earnedBadges;
}
