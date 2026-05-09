package com.study11408.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 学习计划生成请求体。
 *
 * <p>校验：
 * <ul>
 *   <li>weeks ∈ [1, 52]</li>
 *   <li>goal 非空</li>
 *   <li>subjectId 可空（仅当用户希望针对单学科出计划时填）</li>
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyPlanRequest {

    /** 可空：null 表示总览（不限学科）；给定时计划只针对该学科。 */
    private Long subjectId;

    @Min(value = 1, message = "weeks 不能小于 1")
    @Max(value = 52, message = "weeks 不能大于 52")
    private int weeks;

    @NotBlank(message = "goal 不能为空")
    private String goal;
}
