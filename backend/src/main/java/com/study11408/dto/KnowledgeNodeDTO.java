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
public class KnowledgeNodeDTO {

    private Long id;
    private String title;
    private String content;
    private String difficulty;
    private Long topicId;
    private String topicName;
    private String subjectName;
    private String metadata;
    private LocalDateTime createdAt;
}
