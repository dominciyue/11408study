package com.study11408.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "study_sessions")
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    // 同 QuizQuestion / StudyProgress：lazy proxy 直出会让 Jackson 找不到
    // hibernateLazyInitializer 序列化器 → PUT /end 500。前端只需 userId/subjectId。
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "subject_id", insertable = false, updatable = false)
    private Long subjectId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Builder.Default
    @Column(name = "mode", nullable = false, length = 50)
    private String mode = "free";

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Builder.Default
    @Column(name = "studied_nodes", nullable = false)
    private Integer studiedNodes = 0;

    @Builder.Default
    @Column(name = "reviewed_nodes", nullable = false)
    private Integer reviewedNodes = 0;
}
