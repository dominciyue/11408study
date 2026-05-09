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
    /** 节点所属 topic 名（可选；前端按此分组）。 */
    private String topicName;
    /** 节点标题（前端展示出处更直观）。 */
    private String nodeTitle;
}

