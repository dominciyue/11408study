package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.TopicDTO;
import com.study11408.service.TopicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "主题管理", description = "主题的增删改查")
@RestController
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @Operation(summary = "获取科目下的主题列表")
    @GetMapping("/subjects/{subjectId}/topics")
    public ApiResponse<List<TopicDTO>> getTopicsBySubject(@PathVariable Long subjectId) {
        return ApiResponse.ok(topicService.getTopicsBySubject(subjectId));
    }

    @Operation(summary = "创建主题")
    @PostMapping("/topics")
    public ApiResponse<TopicDTO> createTopic(@Valid @RequestBody TopicDTO dto) {
        return ApiResponse.ok(topicService.createTopic(dto));
    }

    @Operation(summary = "更新主题")
    @PutMapping("/topics/{id}")
    public ApiResponse<TopicDTO> updateTopic(@PathVariable Long id, @Valid @RequestBody TopicDTO dto) {
        return ApiResponse.ok(topicService.updateTopic(id, dto));
    }
}
