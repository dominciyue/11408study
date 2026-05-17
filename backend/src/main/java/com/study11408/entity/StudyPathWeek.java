package com.study11408.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 预置学习路径的"周"维度内容。
 *
 * <p>三个 JSONB 字段（{@code dailyTasks}/{@code focusTopics}/{@code resourceHints}）在 entity
 * 层保留 {@code String} 形态（PG 端是 jsonb），由 Service 层在转 DTO 时通过 ObjectMapper
 * 反序列化为 {@code List<String>}；这样既保住 PG 端 JSONB 校验/索引能力，又避免在 entity
 * 上挂自定义 converter。写法对齐 {@link QuizQuestion#getOptions()}。
 *
 * <p>{@code path} 关联用 {@link JsonIgnore} 屏蔽 wire-side 回环（Path 也用 @JsonIgnore 屏蔽
 * weeks），Controller 不会直接返回 Entity，统一走 DTO 路径。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "study_path_weeks")
public class StudyPathWeek {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "path_id", insertable = false, updatable = false)
    private Long pathId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id", nullable = false)
    private StudyPath path;

    @Column(name = "week_no", nullable = false)
    private Integer weekNo;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String goal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "daily_tasks", columnDefinition = "jsonb")
    private String dailyTasks;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "focus_topics", columnDefinition = "jsonb")
    private String focusTopics;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "resource_hints", columnDefinition = "jsonb")
    private String resourceHints;
}
