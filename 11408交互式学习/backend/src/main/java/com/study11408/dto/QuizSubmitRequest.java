package com.study11408.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmitRequest {

    @NotNull(message = "题目ID不能为空")
    private Long questionId;

    @NotBlank(message = "答案不能为空")
    private String userAnswer;
}
