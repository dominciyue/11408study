package com.study11408.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyFeedbackRequest {

    @NotNull(message = "节点ID不能为空")
    private Long nodeId;

    @NotNull(message = "评分不能为空")
    @Min(value = 0, message = "评分最小为0")
    @Max(value = 5, message = "评分最大为5")
    private Integer rating;
}
