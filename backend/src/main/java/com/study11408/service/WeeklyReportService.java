package com.study11408.service;

import com.study11408.dto.BadgeDTO;
import com.study11408.dto.WeeklyReportDTO;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.StudySession;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.StudySessionRepository;
import com.study11408.repository.SubjectRepository;
import com.study11408.repository.WrongAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 本周学习周报 service — 独立于 {@link StatsService}，不污染既有方法。
 *
 * <p>所有数据派生自 4 个既有 repo（sessions / progress / wrongs / subjects），无新表。
 */
@Service
@RequiredArgsConstructor
public class WeeklyReportService {

    /** 滚动窗口长度（天）— 包含今天在内向前数 7 天。 */
    static final int WINDOW_DAYS = 7;

    /** 弱主题 mastery 阈值（&lt; 此值算"弱"）。 */
    static final int WEAK_MASTERY_THRESHOLD = 50;

    /** 弱主题返回上限。 */
    static final int TOP_WEAK_LIMIT = 5;

    private final StudySessionRepository sessionRepository;
    private final StudyProgressRepository progressRepository;
    private final WrongAnswerRepository wrongAnswerRepository;
    private final SubjectRepository subjectRepository;

    public WeeklyReportDTO build(Long userId) {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        LocalDate windowStart = today.minusDays(WINDOW_DAYS - 1);

        List<StudySession> sessions = sessionRepository.findByUserIdOrderByStartTimeDesc(userId);
        List<StudyProgress> progressList = progressRepository.findByUserIdWithNodeSubject(userId);

        // ─── 窗口内 sessions（仅 endTime 非空才计入分钟数；新学/复习数不依赖 endTime 但保持一致）
        List<StudySession> windowSessions = sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .filter(s -> {
                    LocalDate d = s.getStartTime().toLocalDate();
                    return !d.isBefore(windowStart) && !d.isAfter(today);
                })
                .collect(Collectors.toList());

        long totalMinutes = windowSessions.stream()
                .filter(s -> s.getEndTime() != null)
                .mapToLong(s -> Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                .sum();

        // 与 StatsService 同：StudySession.studiedNodes 列没人递增 → 永远 0。
        // 改用 StudyProgress.lastReview 在窗口内的去重节点数。
        long studiedNodesThisWeek = progressList.stream()
                .filter(p -> p.getLastReview() != null)
                .filter(p -> {
                    LocalDate d = p.getLastReview().toLocalDate();
                    return !d.isBefore(windowStart) && !d.isAfter(today);
                })
                .filter(p -> p.getRepetitionCount() != null && p.getRepetitionCount() <= 1)
                .count();

        long reviewedNodesThisWeek = progressList.stream()
                .filter(p -> p.getLastReview() != null)
                .filter(p -> {
                    LocalDate d = p.getLastReview().toLocalDate();
                    return !d.isBefore(windowStart) && !d.isAfter(today);
                })
                .filter(p -> p.getRepetitionCount() != null && p.getRepetitionCount() > 1)
                .count();

        Map<LocalDate, List<StudySession>> windowByDay = windowSessions.stream()
                .collect(Collectors.groupingBy(s -> s.getStartTime().toLocalDate()));

        // 任何窗口内 lastReview 也算活跃，否则 feedback-only 用户 daysActive=0
        java.util.Set<LocalDate> reviewDaysInWindow = progressList.stream()
                .filter(p -> p.getLastReview() != null)
                .map(p -> p.getLastReview().toLocalDate())
                .filter(d -> !d.isBefore(windowStart) && !d.isAfter(today))
                .collect(Collectors.toSet());

        java.util.Set<LocalDate> activeDays = new java.util.HashSet<>(reviewDaysInWindow);
        windowByDay.forEach((d, s) -> { if (hasAnyActivity(s)) activeDays.add(d); });
        int daysActive = activeDays.size();

        // dailyMinutes 长度恒为 7，下标 0 = windowStart，下标 6 = today
        List<Long> dailyMinutes = new ArrayList<>(WINDOW_DAYS);
        for (int i = 0; i < WINDOW_DAYS; i++) {
            LocalDate day = windowStart.plusDays(i);
            long minutes = windowByDay.getOrDefault(day, Collections.emptyList()).stream()
                    .filter(s -> s.getEndTime() != null)
                    .mapToLong(s -> Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                    .sum();
            dailyMinutes.add(minutes);
        }

        // ─── streak: session + 任何 lastReview 都算"学过"
        java.util.Set<LocalDate> allReviewDays = progressList.stream()
                .filter(p -> p.getLastReview() != null)
                .map(p -> p.getLastReview().toLocalDate())
                .collect(Collectors.toSet());
        int streakDays = computeStreakDays(sessions, allReviewDays, today);

        // ─── 弱主题 top 5
        List<String> topWeakTopics = computeTopWeakTopics(progressList);

        // ─── 已解锁徽章数（复用 StatsService.computeBadges 静态 helper）
        long studiedNodesTotal = progressList.size();
        double avgMastery = progressList.stream()
                .mapToInt(p -> p.getMasteryLevel() == null ? 0 : p.getMasteryLevel())
                .average()
                .orElse(0.0);
        long studyTimeTodayMinutes = sessions.stream()
                .filter(s -> s.getStartTime() != null && s.getStartTime().toLocalDate().equals(today))
                .filter(s -> s.getEndTime() != null)
                .mapToLong(s -> Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                .sum();
        long reviewedToday = sessions.stream()
                .filter(s -> s.getStartTime() != null && s.getStartTime().toLocalDate().equals(today))
                .mapToLong(s -> s.getReviewedNodes() == null ? 0 : s.getReviewedNodes())
                .sum();

        List<BadgeDTO> badges = StatsService.computeBadges(
                streakDays, studiedNodesTotal, studyTimeTodayMinutes, reviewedToday, avgMastery);
        int earnedBadges = (int) badges.stream().filter(BadgeDTO::getEarned).count();

        return WeeklyReportDTO.builder()
                .weekStart(windowStart)
                .weekEnd(today)
                .totalMinutes(totalMinutes)
                .daysActive(daysActive)
                .studiedNodesThisWeek(studiedNodesThisWeek)
                .reviewedNodesThisWeek(reviewedNodesThisWeek)
                .dailyMinutes(dailyMinutes)
                .streakDays(streakDays)
                .topWeakTopics(topWeakTopics)
                .earnedBadges(earnedBadges)
                .build();
    }

    /**
     * 与 {@link StatsService#getOverviewV2} 同算法的连续学习天数计算。
     *
     * <p>从今天开始向前数：当天有任何 session（endTime 非空且分钟&gt;0，或 studied/reviewed&gt;0）则算"学习了"；
     * 一旦遇到没学的天数就 break。最大回溯 365 天。
     */
    static int computeStreakDays(List<StudySession> sessions, java.util.Set<LocalDate> reviewDays, LocalDate today) {
        Map<LocalDate, List<StudySession>> sessionsByDay = sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .collect(Collectors.groupingBy(s -> s.getStartTime().toLocalDate()));

        int streak = 0;
        for (int i = 0; i < 365; i++) {
            LocalDate day = today.minusDays(i);
            List<StudySession> daySessions = sessionsByDay.getOrDefault(day, Collections.emptyList());
            if (!reviewDays.contains(day) && !hasAnyActivity(daySessions)) break;
            streak++;
        }
        return streak;
    }

    private static boolean hasAnyActivity(List<StudySession> daySessions) {
        return daySessions.stream().anyMatch(s -> {
            if (s.getEndTime() == null) {
                // 进行中的 session 也允许 studied/reviewed > 0 算活跃
                return (s.getStudiedNodes() != null && s.getStudiedNodes() > 0)
                        || (s.getReviewedNodes() != null && s.getReviewedNodes() > 0);
            }
            long minutes = Duration.between(s.getStartTime(), s.getEndTime()).toMinutes();
            return minutes > 0
                    || (s.getStudiedNodes() != null && s.getStudiedNodes() > 0)
                    || (s.getReviewedNodes() != null && s.getReviewedNodes() > 0);
        });
    }

    /**
     * mastery &lt; 50 的节点 → group by topic name → 按出现次数 desc 取 top {@link #TOP_WEAK_LIMIT}。
     */
    static List<String> computeTopWeakTopics(List<StudyProgress> progressList) {
        Map<String, Long> countByTopic = progressList.stream()
                .filter(p -> p.getMasteryLevel() != null && p.getMasteryLevel() < WEAK_MASTERY_THRESHOLD)
                .filter(p -> p.getNode() != null && p.getNode().getTopic() != null
                        && p.getNode().getTopic().getName() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getNode().getTopic().getName(),
                        Collectors.counting()));

        return countByTopic.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(TOP_WEAK_LIMIT)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}
