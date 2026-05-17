package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.StudyPathDTO;
import com.study11408.service.StudyPathCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 预置学习路径目录接口。
 *
 * <p>路由前缀 {@code /study-paths} 故意与既有 {@code /study/...}（个人化 AI 学习计划）
 * 区分开 —— 这一组数据是运营/教研侧维护、所有用户共享的"专家路径"，列表 + 详情
 * 都对游客开放（前端登录前的首页推荐区也会用），权限放行写在 SecurityConfig。
 */
@Tag(name = "学习路径目录", description = "预置专家编排路径（区别于 AI 即时生成的周计划）")
@RestController
@RequestMapping("/study-paths")
@RequiredArgsConstructor
public class StudyPathCatalogController {

    private final StudyPathCatalogService service;

    @Operation(summary = "列出所有预置学习路径（可按学科过滤）")
    @GetMapping
    public ApiResponse<List<StudyPathDTO>> list(@RequestParam(required = false) Long subjectId) {
        return ApiResponse.ok(service.list(subjectId));
    }

    @Operation(summary = "查询单条学习路径详情（含分周）")
    @GetMapping("/{id}")
    public ApiResponse<StudyPathDTO> getDetail(@PathVariable Long id) {
        return ApiResponse.ok(service.getDetail(id));
    }
}
