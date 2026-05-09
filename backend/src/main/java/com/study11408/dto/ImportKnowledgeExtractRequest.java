package com.study11408.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportKnowledgeExtractRequest {
    @NotBlank(message = "文本不能为空")
    private String text;

    private String subject;
    private String topic;
}

