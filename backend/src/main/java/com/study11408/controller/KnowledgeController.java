package com.study11408.controller;

import com.study11408.dto.*;
import com.study11408.service.KnowledgeGraphService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "知识图谱", description = "知识节点和关系的管理")
@RestController
@RequestMapping("/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeGraphService knowledgeGraphService;

    @Operation(summary = "分页查询知识节点")
    @GetMapping("/nodes")
    public ApiResponse<Page<KnowledgeNodeDTO>> getNodes(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(knowledgeGraphService.getNodes(topicId, subjectId, keyword, pageable));
    }

    @Operation(summary = "获取单个知识节点")
    @GetMapping("/nodes/{id}")
    public ApiResponse<KnowledgeNodeDTO> getNode(@PathVariable Long id) {
        return ApiResponse.ok(knowledgeGraphService.getNodeById(id));
    }

    @Operation(summary = "创建知识节点")
    @PostMapping("/nodes")
    public ApiResponse<KnowledgeNodeDTO> createNode(@Valid @RequestBody CreateNodeRequest request) {
        return ApiResponse.ok(knowledgeGraphService.createNode(request));
    }

    @Operation(summary = "更新知识节点")
    @PutMapping("/nodes/{id}")
    public ApiResponse<KnowledgeNodeDTO> updateNode(@PathVariable Long id, @Valid @RequestBody CreateNodeRequest request) {
        return ApiResponse.ok(knowledgeGraphService.updateNode(id, request));
    }

    @Operation(summary = "删除知识节点")
    @DeleteMapping("/nodes/{id}")
    public ApiResponse<Void> deleteNode(@PathVariable Long id) {
        knowledgeGraphService.deleteNode(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "获取节点关联的边")
    @GetMapping("/edges")
    public ApiResponse<List<KnowledgeEdgeDTO>> getEdges(@RequestParam Long nodeId) {
        return ApiResponse.ok(knowledgeGraphService.getEdgesByNodeId(nodeId));
    }

    @Operation(summary = "创建知识关系")
    @PostMapping("/edges")
    public ApiResponse<KnowledgeEdgeDTO> createEdge(@Valid @RequestBody CreateEdgeRequest request) {
        return ApiResponse.ok(knowledgeGraphService.createEdge(request));
    }

    @Operation(summary = "删除知识关系")
    @DeleteMapping("/edges/{id}")
    public ApiResponse<Void> deleteEdge(@PathVariable Long id) {
        knowledgeGraphService.deleteEdge(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "获取学科完整图谱数据")
    @GetMapping("/graph/{subjectId}")
    public ApiResponse<GraphDataDTO> getGraphData(@PathVariable Long subjectId) {
        return ApiResponse.ok(knowledgeGraphService.getGraphData(subjectId));
    }

    @Operation(summary = "获取节点聚焦子图")
    @GetMapping("/graph/focus/{nodeId}")
    public ApiResponse<GraphDataDTO> getFocusGraph(
            @PathVariable Long nodeId,
            @RequestParam(defaultValue = "2") int depth) {
        return ApiResponse.ok(knowledgeGraphService.getFocusGraph(nodeId, depth));
    }

    @Operation(summary = "搜索知识节点")
    @GetMapping("/search")
    public ApiResponse<Page<KnowledgeNodeDTO>> searchNodes(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(knowledgeGraphService.searchNodes(q, pageable));
    }

    @Operation(summary = "AI 深入解读节点（详解/口诀/类比）")
    @PostMapping("/nodes/{id}/ai-enhance")
    public ApiResponse<Map<String, Object>> aiEnhanceNode(
            @PathVariable Long id,
            @RequestParam(defaultValue = "EXPLAIN") String type) {
        return ApiResponse.ok(knowledgeGraphService.aiEnhanceNode(id, type));
    }
}
