package com.study11408.service;

import com.study11408.entity.StudyProgress;
import com.study11408.entity.StudySession;
import com.study11408.entity.WrongAnswer;
import com.study11408.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final StudyProgressRepository progressRepository;
    private final StudySessionRepository sessionRepository;
    private final WrongAnswerRepository wrongAnswerRepository;
    private final KnowledgeNodeRepository nodeRepository;

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

        List<Map<String, Object>> weakNodes = wrongCountByNode.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("nodeId", entry.getKey());
                    item.put("wrongCount", entry.getValue());
                    nodeRepository.findById(entry.getKey())
                            .ifPresent(node -> {
                                item.put("nodeTitle", node.getTitle());
                                item.put("topicName", node.getTopic() != null ? node.getTopic().getName() : null);
                            });
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
}
