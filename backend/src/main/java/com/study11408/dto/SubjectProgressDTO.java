package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectProgressDTO {
    private Long subjectId;
    private String name;
    private String code;
    private String color;
    private Double progress; // 0-100
    private Long totalNodes;
    private Long studiedNodes;
    private Long masteredNodes;
}

