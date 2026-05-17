package com.study11408.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 学习路径周次 DTO。
 *
 * <p>{@code dailyTasks}/{@code focusTopics}/{@code resourceHints} 在 entity 里是 jsonb 字符串，
 * 这里反序列化为 {@code List<String>}；Service 层若解析失败会兜底为空列表（不抛异常），
 * 避免一条脏数据拖垮整个路径详情接口。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudyPathWeekDTO {
    private Long id;
    private Integer weekNo;
    private String title;
    private String goal;
    private List<String> dailyTasks;
    private List<String> focusTopics;
    private List<String> resourceHints;
}
