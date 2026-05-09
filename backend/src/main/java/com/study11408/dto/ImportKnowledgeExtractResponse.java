package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportKnowledgeExtractResponse {
    private List<ExtractedKnowledgePointDTO> knowledgePoints;
    private String rawText;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExtractedKnowledgePointDTO {
        private String title;
        private String content;
        private String difficulty; // EASY/MEDIUM/HARD
        private List<Map<String, Object>> suggestedRelations;
        /**
         * "PDF 出处定位"用：来自 ai-service 的原文 1-3 句直接引用（≤120 字）。
         * 当前由前端展示；后续若 extract 落库 knowledge_nodes 时会同步写入
         * knowledge_node_sources 表。
         */
        private String sourceExcerpt;
    }
}

