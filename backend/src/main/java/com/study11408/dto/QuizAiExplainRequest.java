package com.study11408.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAiExplainRequest {

    @NotBlank(message = "userAnswer 不能为空")
    private String userAnswer;

    @Valid
    private List<ChatMessageDTO> history;
}
