package com.study11408.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 知识点的"原文出处"。
 *
 * <p>用于"PDF 出处定位"特性：抽取知识点时记下其在哪份 {@link Material} 的哪一页，
 * 以及一段 ≤120 字的原文 excerpt，便于学习时回到原文核对。
 *
 * <p>Material 关系为弱关联：仅保留 materialId（不映射 ManyToOne 到 Material 实体），
 * 一来避免 N+1，二来当 material 被删除时数据库会 SET NULL，应用层不需要级联感知。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "knowledge_node_sources")
public class KnowledgeNodeSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "node_id", insertable = false, updatable = false)
    private Long nodeId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private KnowledgeNode node;

    /**
     * 仅保留 ID，不映射 Material 实体（弱关联，删除时 SET NULL）。
     */
    @Column(name = "material_id")
    private Long materialId;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(columnDefinition = "TEXT")
    private String excerpt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
