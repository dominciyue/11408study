package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * GET /api/stats/weakness 的响应体。
 *
 * <p>subjects: 4 个学科的能力均值（用于雷达图 4 轴）
 * <p>weakTopics: 当前用户掌握度最低的 10 个 topic（前提是用户已经在该 topic 学过任意节点）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeaknessRadarResponse {

    private List<SubjectMastery> subjects;
    private List<WeakTopic> weakTopics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectMastery {
        private Long id;
        private String name;
        private String code;
        private double mastery;     // 0-100，所有节点 mastery_level 的均值
        private int nodes;          // 该学科节点总数
        private int studied;        // 用户已学习节点数（有 study_progress 记录）
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeakTopic {
        private Long id;
        private String name;
        private String subjectName;
        private double mastery;     // 该 topic 下所有节点 mastery_level 的均值
        private int nodes;
    }
}
