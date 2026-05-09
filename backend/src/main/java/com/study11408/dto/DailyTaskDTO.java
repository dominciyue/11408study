package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTaskDTO {
    private String code;
    private String name;
    private Long current;
    private Long target;
    private Boolean completed;
}
