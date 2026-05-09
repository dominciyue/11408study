package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WrongAnswerDTO {
    private Long id;
    private Long questionId;
    private Long nodeId;
    private String questionText;
    private String userAnswer;
    private String correctAnswer;
    private String explanation;
    private LocalDateTime answeredAt;
    private Boolean resolved;
}

