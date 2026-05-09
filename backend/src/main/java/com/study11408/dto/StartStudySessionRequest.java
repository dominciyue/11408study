package com.study11408.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartStudySessionRequest {
    private Long subjectId;

    @NotBlank(message = "学习模式不能为空")
    private String mode;
}

