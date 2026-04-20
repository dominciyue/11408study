package com.study11408.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateNodeRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    private String content;

    private String difficulty;

    @NotNull(message = "主题ID不能为空")
    private Long topicId;

    private String metadata;
}
