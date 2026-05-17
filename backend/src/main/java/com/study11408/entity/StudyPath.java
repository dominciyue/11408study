package com.study11408.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 预置专家编排学习路径（区别于 {@link StudyPlan} —— 用户私有的 AI 即时生成计划）。
 *
 * <p>这张表的行由 Flyway 种入（运营/教研侧维护），所有用户共享；DDL 设计为 {@code code}
 * 唯一以便升级时按 code 幂等 upsert。
 *
 * <p>{@code subjectId} 用 {@code Long} 字段而非 {@code @ManyToOne} 关联：参考 {@link StudyPlan}
 * 的写法，避免 Subject 懒加载链路被无谓拉到接口 wire 上 —— 列表/详情接口前端只需 subjectId
 * 数值即可（subject 名字另由 {@code /subjects} 接口获取）。
 *
 * <p>{@code weeks} 是反向 LazyOneToMany：用 {@link JsonIgnore} 截断序列化环
 * （Week 反过来 ManyToOne 到 Path），Service 层显式拉 weeks 列表注入 DTO。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "study_paths")
public class StudyPath {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** 可空：null 表示综合 / 跨学科路径。 */
    @Column(name = "subject_id")
    private Long subjectId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_weeks", nullable = false)
    private Integer durationWeeks;

    @Column(length = 20)
    private String difficulty;

    @Column(name = "target_audience", length = 200)
    private String targetAudience;

    @Column(name = "total_hours")
    private Integer totalHours;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "path", fetch = FetchType.LAZY)
    private List<StudyPathWeek> weeks;
}
