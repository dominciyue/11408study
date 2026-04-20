package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectDTO {

    private Long id;
    private String name;
    private String code;
    private String icon;
    private String color;
    private String description;
    private Integer sortOrder;
}
