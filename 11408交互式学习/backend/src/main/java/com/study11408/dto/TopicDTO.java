package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicDTO {

    private Long id;
    private String name;
    private String description;
    private Integer sortOrder;
    private Long subjectId;
    private String subjectName;
}
