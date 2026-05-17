package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.entity.Material;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.MaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "资料管理", description = "文件上传、资料关联")
@RestController
@RequestMapping("/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "上传资料文件")
    @PostMapping("/upload")
    public ApiResponse<Material> upload(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long nodeId) {
        Long userId = getUserId(request);
        return ApiResponse.ok(materialService.uploadMaterial(file, title, nodeId, userId));
    }

    @Operation(summary = "获取资料列表",
            description = "nodeId 优先；否则按 subjectId/type 联合筛选，均为空时返回全部。")
    @GetMapping
    public ApiResponse<List<Material>> getMaterials(
            @RequestParam(required = false) Long nodeId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String type) {
        if (nodeId != null) {
            return ApiResponse.ok(materialService.getMaterialsByNodeId(nodeId));
        }
        return ApiResponse.ok(materialService.searchMaterials(subjectId, type));
    }

    @Operation(summary = "删除资料（仅上传者或管理员）")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(HttpServletRequest request, @PathVariable Long id) {
        Long userId = getUserId(request);
        materialService.deleteMaterial(id, userId);
        return ApiResponse.ok();
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}
