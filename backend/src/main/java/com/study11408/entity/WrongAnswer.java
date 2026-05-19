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
@Table(name = "wrong_answers")
public class WrongAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "question_id", insertable = false, updatable = false)
    private Long questionId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    @Column(name = "user_answer")
    private String userAnswer;

    @Column(name = "answered_at", nullable = false)
    private LocalDateTime answeredAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean resolved = false;

    /** 已纳入 SM-2 复习队列的时刻；NULL = 尚未入队（同题第 1 次错误时记录但不入队） */
    @Column(name = "enqueued_at")
    private LocalDateTime enqueuedAt;

    /** AI 归类的错误"病因"。固定 5 类枚举(英文 key)。NULL = 尚未归类 / AI 失败。
     *  CONCEPT_UNCLEAR / CALCULATION_ERROR / MISREAD_QUESTION / KNOWLEDGE_GAP / UNFAMILIAR_TYPE */
    @Column(name = "error_category", length = 50)
    private String errorCategory;
}
