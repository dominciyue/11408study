package com.study11408.controller;

import com.study11408.dto.*;
import com.study11408.entity.Material;
import com.study11408.exception.BusinessException;
import com.study11408.repository.MaterialRepository;
import com.study11408.service.AiClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "资料导入", description = "PDF解析、知识点提取、导入前预览")
@RestController
@RequestMapping("/import")
@RequiredArgsConstructor
public class ImportController {

    private final MaterialRepository materialRepository;
    private final AiClientService aiClientService;

    @Operation(summary = "解析资料PDF为分块")
    @PostMapping("/materials/{materialId}/parse-pdf")
    public ApiResponse<ImportPdfParseResponse> parsePdf(@PathVariable Long materialId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new BusinessException("资料不存在", HttpStatus.NOT_FOUND));

        if (material.getFileUrl() == null || material.getFileUrl().isBlank()) {
            throw new BusinessException("资料缺少文件地址", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> raw = aiClientService.parsePdf(material.getFileUrl());
        if (raw == null || raw.containsKey("error")) {
            throw new BusinessException("PDF 解析失败: " + (raw == null ? "AI服务无响应" : raw.get("error")), HttpStatus.BAD_GATEWAY);
        }

        String title = raw.get("title") != null ? String.valueOf(raw.get("title")) : null;
        Integer totalPages = raw.get("total_pages") instanceof Number ? ((Number) raw.get("total_pages")).intValue() : null;

        List<Map<String, Object>> chunksRaw = (List<Map<String, Object>>) raw.get("chunks");
        List<ImportPdfParseResponse.PdfChunkDTO> chunks = chunksRaw == null ? List.of() : chunksRaw.stream().map(c -> {
            String content = c.get("content") != null ? String.valueOf(c.get("content")) : "";
            Integer pageNumber = c.get("page_number") instanceof Number ? ((Number) c.get("page_number")).intValue() : null;
            String sectionTitle = c.get("section_title") != null ? String.valueOf(c.get("section_title")) : null;
            return ImportPdfParseResponse.PdfChunkDTO.builder()
                    .content(content)
                    .pageNumber(pageNumber)
                    .sectionTitle(sectionTitle)
                    .build();
        }).toList();

        return ApiResponse.ok(ImportPdfParseResponse.builder()
                .title(title)
                .totalPages(totalPages)
                .chunks(chunks)
                .build());
    }

    @Operation(summary = "对文本分块进行知识点提取")
    @PostMapping("/extract")
    public ApiResponse<ImportKnowledgeExtractResponse> extract(@Valid @RequestBody ImportKnowledgeExtractRequest body) {
        Map<String, Object> raw = aiClientService.extractKnowledge(body.getText(), body.getSubject(), body.getTopic());
        if (raw == null || raw.containsKey("error")) {
            throw new BusinessException("知识点提取失败: " + (raw == null ? "AI服务无响应" : raw.get("error")), HttpStatus.BAD_GATEWAY);
        }

        String rawText = raw.get("raw_text") != null ? String.valueOf(raw.get("raw_text")) : null;
        List<Map<String, Object>> pointsRaw = (List<Map<String, Object>>) raw.get("knowledge_points");
        List<ImportKnowledgeExtractResponse.ExtractedKnowledgePointDTO> points = pointsRaw == null ? List.of() : pointsRaw.stream().map(p -> {
            String title = p.get("title") != null ? String.valueOf(p.get("title")) : "";
            String content = p.get("content") != null ? String.valueOf(p.get("content")) : "";
            String difficulty = p.get("difficulty") != null ? String.valueOf(p.get("difficulty")) : null;
            List<Map<String, Object>> suggestedRelations = (List<Map<String, Object>>) p.get("suggested_relations");
            return ImportKnowledgeExtractResponse.ExtractedKnowledgePointDTO.builder()
                    .title(title)
                    .content(content)
                    .difficulty(difficulty)
                    .suggestedRelations(suggestedRelations)
                    .build();
        }).toList();

        return ApiResponse.ok(ImportKnowledgeExtractResponse.builder()
                .knowledgePoints(points)
                .rawText(rawText)
                .build());
    }
}

