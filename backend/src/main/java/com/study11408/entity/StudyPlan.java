package com.study11408.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 用户保存的 AI 周学习计划。
 *
 * <p>{@code planJson} 是 ai-service 返回 plan 数组的完整 JSON 字符串
 * （由 {@code ObjectMapper.writeValueAsString} 序列化），前端拿到后 JSON.parse
 * 还原为 {@code WeekPlan[]}。
 *
 * <p>序列化策略：{@code user} 用 {@link JsonIgnore} 避免懒加载链路被拉到 wire 上；
 * 前端只需 {@code userId}（隐式由 ownership 校验保证）。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "study_plans")
public class StudyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 可空：null 表示综合计划（不限学科）。 */
    @Column(name = "subject_id")
    private Long subjectId;

    @Column(nullable = false)
    private Integer weeks;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String goal;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "plan_json", nullable = false, columnDefinition = "TEXT")
    private String planJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
