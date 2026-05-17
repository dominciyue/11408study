package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * QuizQuestion 对外 DTO：与前端 {@code types/index.ts} 的 QuizQuestion interface 字段一一对应。
 *
 * <p>当 {@code externalUrl} 非空时，该题为 link-based 题目（外部公开课 / 真题 PDF / 视频解析），
 * 前端 practice 页将不渲染 4 个 inline 选项，而是渲染外链按钮 + 自评区。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestionDTO {
    private Long id;
    private Long nodeId;
    private String questionType;
    private String content;
    /** options 的 JSON 字符串（与 entity 一致；前端 JSON.parse）。link-based 题可为 null。 */
    private String options;
    private String answer;
    private String explanation;
    private String source;

    // ─── link-based 题目字段 (V11) ───────────────────────────────────────────
    /** 外部题目页 / 解析视频 URL；非空 → link-based 模式 */
    private String externalUrl;
    /** 来源标识，如 "王道公开课"、"2020 408 真题 PDF" */
    private String externalSource;
    /** 真题年份，如 2020；可空 */
    private Integer year;
    /** 该年的题号，如 1-40；可空 */
    private Integer questionNumber;

    private LocalDateTime createdAt;
}
