package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeEdgeDTO {

    private Long id;
    private Long sourceId;
    private Long targetId;
    private String sourceTitle;
    private String targetTitle;
    private String relationType;
    private Double weight;
    private String description;
}
