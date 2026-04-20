package com.study11408.entity;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "knowledge_edges")
public class KnowledgeEdge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", insertable = false, updatable = false)
    private Long sourceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id", nullable = false)
    private KnowledgeNode source;

    @Column(name = "target_id", insertable = false, updatable = false)
    private Long targetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private KnowledgeNode target;

    @Column(name = "relation_type", nullable = false, length = 50)
    private String relationType;

    @Builder.Default
    @Column(nullable = false)
    private Double weight = 1.0;

    private String description;
}
