package com.study11408.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "study_progress", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "node_id"})
})
public class StudyProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "node_id", insertable = false, updatable = false)
    private Long nodeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private KnowledgeNode node;

    @Builder.Default
    @Column(name = "mastery_level", nullable = false)
    private Integer masteryLevel = 0;

    @Column(name = "last_review")
    private LocalDateTime lastReview;

    @Column(name = "next_review")
    private LocalDateTime nextReview;

    @Builder.Default
    @Column(name = "repetition_count", nullable = false)
    private Integer repetitionCount = 0;

    @Builder.Default
    @Column(name = "ease_factor", nullable = false)
    private Double easeFactor = 2.5;
}
