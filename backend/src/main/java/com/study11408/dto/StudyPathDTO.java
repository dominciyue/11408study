package com.study11408.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 预置学习路径 DTO —— 列表项 & 详情共用。
 *
 * <p>{@code weeks} 在列表接口返回时为 null（{@link JsonInclude#Include#NON_NULL} 自动剔除），
 * 仅详情接口 {@code GET /study-paths/{id}} 填充。前端通过字段是否存在判断是否要渲染周次面板。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudyPathDTO {
    private Long id;
    private String code;
    private String title;
    private String description;
    private Long subjectId;
    private Integer durationWeeks;
    private String difficulty;
    private String targetAudience;
    private Integer totalHours;
    private Integer sortOrder;
    /** 仅详情接口返回；列表接口为 null。 */
    private List<StudyPathWeekDTO> weeks;
}
