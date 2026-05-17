package com.study11408.controller;

import com.study11408.dto.*;
import com.study11408.entity.Material;
import com.study11408.exception.BusinessException;
import com.study11408.repository.MaterialRepository;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.AiClientService;
import com.study11408.service.AiRateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
    private final JwtTokenProvider jwtTokenProvider;
    private final AiRateLimiter aiRateLimiter;

    @Operation(summary = "解析资料PDF为分块")
    @PostMapping("/materials/{materialId}/parse-pdf")
    public ApiResponse<ImportPdfParseResponse> parsePdf(@PathVariable Long materialId, HttpServletRequest request) {
        Long userId = getUserId(request);
        aiRateLimiter.check(userId);

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new BusinessException("资料不存在", HttpStatus.NOT_FOUND));

        // 归属校验：仅 uploader 本人可触发解析（旧数据 uploaderId 可能为 null，向后兼容放行）
        if (material.getUploaderId() != null && !material.getUploaderId().equals(userId)) {
            throw new BusinessException("无权访问此资料", HttpStatus.FORBIDDEN);
        }

        if (material.getFileUrl() == null || material.getFileUrl().isBlank()) {
            throw new BusinessException("资料缺少文件地址", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> raw = aiClientService.parsePdf(material.getFileUrl());
        if (raw == null || raw.containsKey("error")) {
            throw new BusinessException("PDF 解析失败: " + (raw == null ? "AI服务无响应" : raw.get("error")), HttpStatus.BAD_GATEWAY);
        }

        String title = raw.get("title") != null ? String.valueOf(raw.get("title")) : null;
        Integer totalPages = raw.get("total_pages") instanceof Number ? ((Number) raw.get("total_pages")).intValue() : null;

        // AI 返回 chunks 字段类型异常时直接 ClassCastException 500；先 instanceof 守门。
        Object chunksObj = raw.get("chunks");
        List<Map<String, Object>> chunksRaw = (chunksObj instanceof List<?>) ? (List<Map<String, Object>>) chunksObj : null;
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
    public ApiResponse<ImportKnowledgeExtractResponse> extract(@Valid @RequestBody ImportKnowledgeExtractRequest body, HttpServletRequest request) {
        Long userId = getUserId(request);
        aiRateLimiter.check(userId);

        Map<String, Object> raw = aiClientService.extractKnowledge(body.getText(), body.getSubject(), body.getTopic());
        if (raw == null || raw.containsKey("error")) {
            throw new BusinessException("知识点提取失败: " + (raw == null ? "AI服务无响应" : raw.get("error")), HttpStatus.BAD_GATEWAY);
        }

        String rawText = raw.get("raw_text") != null ? String.valueOf(raw.get("raw_text")) : null;
        Object pointsObj = raw.get("knowledge_points");
        List<Map<String, Object>> pointsRaw = (pointsObj instanceof List<?>) ? (List<Map<String, Object>>) pointsObj : null;
        List<ImportKnowledgeExtractResponse.ExtractedKnowledgePointDTO> points = pointsRaw == null ? List.of() : pointsRaw.stream().map(p -> {
            String title = p.get("title") != null ? String.valueOf(p.get("title")) : "";
            String content = p.get("content") != null ? String.valueOf(p.get("content")) : "";
            String difficulty = p.get("difficulty") != null ? String.valueOf(p.get("difficulty")) : null;
            List<Map<String, Object>> suggestedRelations = (List<Map<String, Object>>) p.get("suggested_relations");
            // "PDF 出处定位"：透传 ai-service 返回的 source_excerpt；空字符串视为缺省。
            Object excerptRaw = p.get("source_excerpt");
            String sourceExcerpt = null;
            if (excerptRaw != null) {
                String s = String.valueOf(excerptRaw).trim();
                if (!s.isEmpty()) {
                    sourceExcerpt = s;
                }
            }
            return ImportKnowledgeExtractResponse.ExtractedKnowledgePointDTO.builder()
                    .title(title)
                    .content(content)
                    .difficulty(difficulty)
                    .suggestedRelations(suggestedRelations)
                    .sourceExcerpt(sourceExcerpt)
                    .build();
        }).toList();

        return ApiResponse.ok(ImportKnowledgeExtractResponse.builder()
                .knowledgePoints(points)
                .rawText(rawText)
                .build());
    }

    /**
     * 从请求中提取当前登录用户 ID。
     * 缺失或非法 token 抛 401（即便 SecurityFilter 已通过，token 中无 userId claim 也视为未登录）。
     */
    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        if (token == null) {
            throw new BusinessException("未登录", HttpStatus.UNAUTHORIZED);
        }
        Long userId = jwtTokenProvider.getUserId(token);
        if (userId == null) {
            throw new BusinessException("未登录", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
