package com.study11408.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateEdgeRequest {

    @NotNull(message = "源节点ID不能为空")
    private Long sourceId;

    @NotNull(message = "目标节点ID不能为空")
    private Long targetId;

    @NotBlank(message = "关系类型不能为空")
    private String relationType;

    private Double weight;

    private String description;
}
