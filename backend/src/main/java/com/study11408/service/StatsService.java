package com.study11408.service;

import com.study11408.dto.BadgeDTO;
import com.study11408.dto.DailyTaskDTO;
import com.study11408.dto.StatsOverviewDTO;
import com.study11408.dto.SubjectProgressDTO;
import com.study11408.dto.WeaknessRadarResponse;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.StudySession;
import com.study11408.entity.Subject;
import com.study11408.entity.Topic;
import com.study11408.entity.WrongAnswer;
import com.study11408.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final StudyProgressRepository progressRepository;
    private final StudySessionRepository sessionRepository;
    private final WrongAnswerRepository wrongAnswerRepository;
    private final KnowledgeNodeRepository nodeRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;

    public Map<String, Object> getOverview(Long userId) {
        List<StudyProgress> progressList = progressRepository.findByUserId(userId);
        List<StudySession> sessions = sessionRepository.findByUserIdOrderByStartTimeDesc(userId);
        List<WrongAnswer> wrongAnswers = wrongAnswerRepository.findByUserId(userId);

        long totalNodes = nodeRepository.count();
        long studiedNodes = progressList.size();
        double avgMastery = progressList.stream()
                .mapToInt(StudyProgress::getMasteryLevel)
                .average()
                .orElse(0.0);

        long totalStudyMinutes = sessions.stream()
                .filter(s -> s.getEndTime() != null)
                .mapToLong(s -> java.time.Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                .sum();

        Map<String, Object> overview = new HashMap<>();
        overview.put("totalNodes", totalNodes);
        overview.put("studiedNodes", studiedNodes);
        overview.put("averageMastery", Math.round(avgMastery * 100.0) / 100.0);
        overview.put("totalStudyMinutes", totalStudyMinutes);
        overview.put("totalSessions", sessions.size());
        overview.put("unresolvedWrongAnswers", wrongAnswers.stream().filter(w -> !w.getResolved()).count());
        overview.put("completionRate", totalNodes > 0 ? Math.round((double) studiedNodes / totalNodes * 10000.0) / 100.0 : 0);

        return overview;
    }

    public StatsOverviewDTO getOverviewV2(Long userId) {
        List<StudyProgress> progressList = progressRepository.findByUserIdWithNodeSubject(userId);
        List<StudySession> sessions = sessionRepository.findByUserIdOrderByStartTimeDesc(userId);

        long totalNodes = nodeRepository.count();
        long studiedNodes = progressList.size();
        long masteredNodes = progressList.stream()
                .filter(p -> p.getMasteryLevel() != null && p.getMasteryLevel() >= 80)
                .count();
        double avgMastery = progressList.stream()
                .mapToInt(p -> p.getMasteryLevel() == null ? 0 : p.getMasteryLevel())
                .average()
                .orElse(0.0);

        long totalStudyMinutes = sessions.stream()
                .filter(s -> s.getEndTime() != null)
                .mapToLong(s -> java.time.Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                .sum();

        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        // P1: 之前依赖 StudySession.studiedNodes 列，但该列从无递增代码 → 永远 0。
        // 现在改用 StudyProgress.lastReview 当天的条目数：
        // - studiedToday：本日首次接触（rep==1）的节点
        // - reviewedToday：本日复习（rep>1）的节点
        long studiedToday = progressList.stream()
                .filter(p -> p.getLastReview() != null
                        && p.getLastReview().toLocalDate().equals(today))
                .filter(p -> p.getRepetitionCount() != null && p.getRepetitionCount() <= 1)
                .count();
        long reviewedToday = progressList.stream()
                .filter(p -> p.getLastReview() != null
                        && p.getLastReview().toLocalDate().equals(today))
                .filter(p -> p.getRepetitionCount() != null && p.getRepetitionCount() > 1)
                .count();
        long studyTimeTodayMinutes = sessions.stream()
                .filter(s -> s.getStartTime() != null && s.getStartTime().toLocalDate().equals(today))
                .filter(s -> s.getEndTime() != null)
                .mapToLong(s -> java.time.Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                .sum();

        Map<LocalDate, List<StudySession>> sessionsByDay = sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .collect(Collectors.groupingBy(s -> s.getStartTime().toLocalDate()));

        // 任何当天 lastReview 也算"学过"，否则只用 feedback 不开 session 的用户 streak=0。
        Set<LocalDate> reviewDays = progressList.stream()
                .filter(p -> p.getLastReview() != null)
                .map(p -> p.getLastReview().toLocalDate())
                .collect(Collectors.toSet());

        int streakDays = 0;
        for (int i = 0; i < 365; i++) {
            LocalDate day = today.minusDays(i);
            List<StudySession> daySessions = sessionsByDay.getOrDefault(day, Collections.emptyList());
            boolean studied = reviewDays.contains(day) || daySessions.stream().anyMatch(s -> {
                if (s.getEndTime() == null) return false;
                long minutes = java.time.Duration.between(s.getStartTime(), s.getEndTime()).toMinutes();
                return minutes > 0 || (s.getStudiedNodes() != null && s.getStudiedNodes() > 0) || (s.getReviewedNodes() != null && s.getReviewedNodes() > 0);
            });
            if (!studied) break;
            streakDays++;
        }

        List<Long> weeklyStudyTimeMinutes = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long minutes = sessionsByDay.getOrDefault(day, Collections.emptyList()).stream()
                    .filter(s -> s.getEndTime() != null)
                    .mapToLong(s -> java.time.Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                    .sum();
            weeklyStudyTimeMinutes.add(minutes);
        }

        List<Subject> subjects = subjectRepository.findAllByOrderBySortOrderAsc();
        Map<Long, List<StudyProgress>> progressBySubjectId = progressList.stream()
                .filter(p -> p.getNode() != null && p.getNode().getTopic() != null && p.getNode().getTopic().getSubject() != null)
                .collect(Collectors.groupingBy(p -> p.getNode().getTopic().getSubject().getId()));

        List<SubjectProgressDTO> subjectProgress = subjects.stream().map(subject -> {
            long subjectTotalNodes = nodeRepository.countByTopicSubjectId(subject.getId());
            List<StudyProgress> subjectProgressList = progressBySubjectId.getOrDefault(subject.getId(), Collections.emptyList());
            long subjectStudied = subjectProgressList.size();
            long subjectMastered = subjectProgressList.stream()
                    .filter(p -> p.getMasteryLevel() != null && p.getMasteryLevel() >= 80)
                    .count();
            double progressPercent = subjectTotalNodes > 0
                    ? Math.round(((double) subjectStudied / subjectTotalNodes) * 10000.0) / 100.0
                    : 0.0;

            return SubjectProgressDTO.builder()
                    .subjectId(subject.getId())
                    .name(subject.getName())
                    .code(subject.getCode())
                    .color(subject.getColor())
                    .progress(progressPercent)
                    .totalNodes(subjectTotalNodes)
                    .studiedNodes(subjectStudied)
                    .masteredNodes(subjectMastered)
                    .build();
        }).collect(Collectors.toList());

        List<BadgeDTO> badges = computeBadges(
                streakDays, studiedNodes, studyTimeTodayMinutes, reviewedToday, avgMastery);
        List<DailyTaskDTO> dailyTasks = computeDailyTasks(
                studiedToday, reviewedToday, studyTimeTodayMinutes);

        return StatsOverviewDTO.builder()
                .totalNodes(totalNodes)
                .studiedNodes(studiedNodes)
                .masteredNodes(masteredNodes)
                .averageMastery(Math.round(avgMastery * 100.0) / 100.0)
                .totalStudyMinutes(totalStudyMinutes)
                .studiedToday(studiedToday)
                .reviewedToday(reviewedToday)
                .studyTimeTodayMinutes(studyTimeTodayMinutes)
                .streakDays(streakDays)
                .weeklyStudyTimeMinutes(weeklyStudyTimeMinutes)
                .subjectProgress(subjectProgress)
                .badges(badges)
                .dailyTasks(dailyTasks)
                .build();
    }

    /**
     * 基于既有数据派生 9 枚徽章（无新表）。
     * 每枚都返回 earned + current/target，前端可据此渲染解锁/未解锁两态。
     */
    public static List<BadgeDTO> computeBadges(
            int streakDays,
            long studiedNodes,
            long studyTimeTodayMinutes,
            long reviewedToday,
            double avgMastery) {
        List<BadgeDTO> badges = new ArrayList<>();
        badges.add(badge("firstStep", "破冰", "连续学习 1 天", "🔥", streakDays, 1));
        badges.add(badge("weekHero", "坚持一周", "连续学习 7 天", "🔥🔥", streakDays, 7));
        badges.add(badge("monthIron", "钢铁意志", "连续学习 30 天", "🔥🔥🔥", streakDays, 30));
        badges.add(badge("starter", "入门学习者", "累计学习 10 个节点", "📚", studiedNodes, 10));
        badges.add(badge("explorer", "知识探索者", "累计学习 50 个节点", "📖", studiedNodes, 50));
        badges.add(badge("master", "考研学霸", "累计学习 100 个节点", "🎯", studiedNodes, 100));
        badges.add(badge("focused", "今日专注", "今日学习满 60 分钟", "⏰", studyTimeTodayMinutes, 60));
        badges.add(badge("reviewer", "复习达人", "今日复习 ≥ 10 个", "🧠", reviewedToday, 10));
        badges.add(badge("perfectionist", "精通", "平均掌握度 ≥ 80%", "💯", Math.round(avgMastery), 80));
        return badges;
    }

    private static BadgeDTO badge(
            String code, String name, String description, String icon,
            long current, long target) {
        long clamped = Math.max(current, 0);
        return BadgeDTO.builder()
                .code(code)
                .name(name)
                .description(description)
                .icon(icon)
                .earned(clamped >= target)
                .current(clamped)
                .target(target)
                .build();
    }

    /**
     * 今日三件套：5 新 / 10 复习 / 30 分钟。规则简单可派生。
     */
    public static List<DailyTaskDTO> computeDailyTasks(
            long studiedToday, long reviewedToday, long studyTimeTodayMinutes) {
        return List.of(
                dailyTask("learn5new", "学习 5 个新节点", studiedToday, 5),
                dailyTask("review10", "复习 10 个节点", reviewedToday, 10),
                dailyTask("focus30min", "专注学习 30 分钟", studyTimeTodayMinutes, 30));
    }

    private static DailyTaskDTO dailyTask(String code, String name, long current, long target) {
        long clamped = Math.max(current, 0);
        return DailyTaskDTO.builder()
                .code(code)
                .name(name)
                .current(clamped)
                .target(target)
                .completed(clamped >= target)
                .build();
    }

    public List<Map<String, Object>> getDailyStats(Long userId) {
        List<StudySession> sessions = sessionRepository.findByUserIdOrderByStartTimeDesc(userId);

        Map<LocalDate, List<StudySession>> grouped = sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .collect(Collectors.groupingBy(s -> s.getStartTime().toLocalDate()));

        List<Map<String, Object>> dailyStats = new ArrayList<>();

        grouped.entrySet().stream()
                .sorted(Map.Entry.<LocalDate, List<StudySession>>comparingByKey().reversed())
                .limit(30)
                .forEach(entry -> {
                    Map<String, Object> day = new HashMap<>();
                    day.put("date", entry.getKey().toString());
                    day.put("sessions", entry.getValue().size());
                    day.put("studiedNodes", entry.getValue().stream().mapToInt(StudySession::getStudiedNodes).sum());
                    day.put("reviewedNodes", entry.getValue().stream().mapToInt(StudySession::getReviewedNodes).sum());
                    long minutes = entry.getValue().stream()
                            .filter(s -> s.getEndTime() != null)
                            .mapToLong(s -> java.time.Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                            .sum();
                    day.put("studyMinutes", minutes);
                    dailyStats.add(day);
                });

        return dailyStats;
    }

    public Map<String, Object> getWeaknessAnalysis(Long userId) {
        List<WrongAnswer> wrongAnswers = wrongAnswerRepository.findByUserId(userId);

        Map<Long, Long> wrongCountByNode = wrongAnswers.stream()
                .collect(Collectors.groupingBy(
                        w -> w.getQuestion().getNodeId(),
                        Collectors.counting()));

        // N+1 修复：先选出 top 10 弱节点 id，再一次 IN 查所有相关节点。
        List<Map.Entry<Long, Long>> topWrong = wrongCountByNode.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(10)
                .toList();
        List<Long> topWrongIds = topWrong.stream().map(Map.Entry::getKey).toList();
        Map<Long, com.study11408.entity.KnowledgeNode> nodeById = nodeRepository
                .findAllById(topWrongIds).stream()
                .collect(Collectors.toMap(com.study11408.entity.KnowledgeNode::getId, n -> n, (a, b) -> a));

        List<Map<String, Object>> weakNodes = topWrong.stream()
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("nodeId", entry.getKey());
                    item.put("wrongCount", entry.getValue());
                    com.study11408.entity.KnowledgeNode node = nodeById.get(entry.getKey());
                    if (node != null) {
                        item.put("nodeTitle", node.getTitle());
                        item.put("topicName", node.getTopic() != null ? node.getTopic().getName() : null);
                    }
                    return item;
                })
                .collect(Collectors.toList());

        List<StudyProgress> lowMastery = progressRepository.findByUserId(userId).stream()
                .filter(p -> p.getMasteryLevel() < 30)
                .sorted(Comparator.comparingInt(StudyProgress::getMasteryLevel))
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("topWrongNodes", weakNodes);
        result.put("lowMasteryNodes", lowMastery.stream().map(p -> {
            Map<String, Object> item = new HashMap<>();
            item.put("nodeId", p.getNodeId());
            item.put("masteryLevel", p.getMasteryLevel());
            item.put("nodeTitle", p.getNode() != null ? p.getNode().getTitle() : null);
            return item;
        }).collect(Collectors.toList()));

        return result;
    }

    /**
     * 弱点雷达图聚合 — Subject 维度 mastery（雷达图 4 轴）+ Top 10 弱 Topic（下钻表格）。
     *
     * <p>实现策略：通过两条 in-memory 聚合一次性算出，避免对 DB 做 N+1 GROUP BY。
     * <ul>
     *   <li>4 学科 mastery = AVG(study_progress.mastery_level) where node in subject</li>
     *   <li>Top 10 弱 topic = AVG(study_progress.mastery_level) per topic，按 mastery ASC 取 10，
     *       要求用户在该 topic 下至少学过 1 个 node（避免推荐未触达的 topic）</li>
     * </ul>
     * 数据量：用户进度行通常 ≤ 1000，topic ≤ 80，O(N) in-memory 完全没问题。
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public WeaknessRadarResponse getWeaknessRadar(Long userId) {
        // 一次性拉所有 progress + node + topic + subject（已有 FETCH JOIN）
        List<StudyProgress> progress = progressRepository.findByUserIdWithNodeSubject(userId);

        // 按 subject 分桶
        Map<Long, List<StudyProgress>> bySubject = progress.stream()
                .filter(p -> p.getNode() != null
                        && p.getNode().getTopic() != null
                        && p.getNode().getTopic().getSubject() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getNode().getTopic().getSubject().getId()));

        // 全部学科（无论用户是否有进度都展示，便于雷达图 4 轴完整）
        List<Subject> subjects = subjectRepository.findAllByOrderBySortOrderAsc();

        // 单次 findAll() 同时算 nodeCountBySubject + nodeCountByTopic，避免 2 次全表扫
        List<com.study11408.entity.KnowledgeNode> allNodes = nodeRepository.findAll();
        Map<Long, Long> nodeCountBySubject = allNodes.stream()
                .filter(n -> n.getTopic() != null && n.getTopic().getSubject() != null)
                .collect(Collectors.groupingBy(
                        n -> n.getTopic().getSubject().getId(),
                        Collectors.counting()));
        Map<Long, Long> nodeCountByTopic = allNodes.stream()
                .filter(n -> n.getTopic() != null)
                .collect(Collectors.groupingBy(
                        n -> n.getTopic().getId(),
                        Collectors.counting()));

        List<WeaknessRadarResponse.SubjectMastery> subjectList = subjects.stream()
                .map(s -> {
                    List<StudyProgress> subjectProgress = bySubject.getOrDefault(s.getId(), List.of());
                    double avg = subjectProgress.stream()
                            .filter(p -> p.getMasteryLevel() != null)
                            .mapToInt(StudyProgress::getMasteryLevel)
                            .average()
                            .orElse(0.0);
                    long studied = subjectProgress.stream()
                            .map(StudyProgress::getNodeId)
                            .distinct()
                            .count();
                    return WeaknessRadarResponse.SubjectMastery.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .code(s.getCode())
                            .mastery(Math.round(avg * 100.0) / 100.0)
                            .nodes(nodeCountBySubject.getOrDefault(s.getId(), 0L).intValue())
                            .studied((int) studied)
                            .build();
                })
                .collect(Collectors.toList());

        // Topic 维度：仅统计用户已学过节点的 topic
        Map<Long, List<StudyProgress>> byTopic = progress.stream()
                .filter(p -> p.getNode() != null && p.getNode().getTopic() != null)
                .collect(Collectors.groupingBy(p -> p.getNode().getTopic().getId()));

        // nodeCountByTopic 已在上面 allNodes 阶段算好，直接复用

        List<WeaknessRadarResponse.WeakTopic> weakTopics = byTopic.entrySet().stream()
                .map(entry -> {
                    Long topicId = entry.getKey();
                    List<StudyProgress> ps = entry.getValue();
                    double avg = ps.stream()
                            .filter(p -> p.getMasteryLevel() != null)
                            .mapToInt(StudyProgress::getMasteryLevel)
                            .average()
                            .orElse(0.0);
                    Topic t = ps.get(0).getNode().getTopic();
                    String subjectName = t.getSubject() != null ? t.getSubject().getName() : null;
                    Long subjectId = t.getSubject() != null ? t.getSubject().getId() : null;
                    return WeaknessRadarResponse.WeakTopic.builder()
                            .id(topicId)
                            .name(t.getName())
                            .subjectId(subjectId)
                            .subjectName(subjectName)
                            .mastery(Math.round(avg * 100.0) / 100.0)
                            .nodes(nodeCountByTopic.getOrDefault(topicId, 0L).intValue())
                            .build();
                })
                .sorted(Comparator.comparingDouble(WeaknessRadarResponse.WeakTopic::getMastery))
                .limit(10)
                .collect(Collectors.toList());

        return WeaknessRadarResponse.builder()
                .subjects(subjectList)
                .weakTopics(weakTopics)
                .build();
    }
}
