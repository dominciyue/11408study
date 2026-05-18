package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 错题本 groupBy=node 的聚合响应单元。
 * 每个 node 一个 group，含累计错误次数与最近答错时间。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WrongAnswerGroupDTO {
    private Long nodeId;
    private String nodeTitle;
    private String topicName;
    private String subjectName;
    private int wrongCount;            // 该 node 的未解决错题数
    private LocalDateTime latestAt;    // 最近答错时间
    private boolean enqueued;          // 是否已纳入复习队列（任意一条 enqueued_at NOT NULL 即为 true）
    private List<WrongAnswerDTO> items;
}
