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
    /** 用于前端按学科 chip 过滤 / 跳转，避免再绕 topic→subject 反查。 */
    private Long subjectId;
    private String subjectName;
    /** 当前登录用户在此节点的 mastery（0-100）；未学过则 null（前端星级显示"未学"）。 */
    private Integer mastery;
    private String metadata;
    private LocalDateTime createdAt;
}
