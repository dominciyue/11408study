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
    }
}

