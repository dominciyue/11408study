package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportPdfParseResponse {
    private String title;
    private Integer totalPages;
    private List<PdfChunkDTO> chunks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PdfChunkDTO {
        private String content;
        private Integer pageNumber;
        private String sectionTitle;
    }
}

