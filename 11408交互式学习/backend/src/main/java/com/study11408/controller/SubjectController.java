package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.SubjectDTO;
import com.study11408.service.SubjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "科目管理", description = "科目的增删改查")
@RestController
@RequestMapping("/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @Operation(summary = "获取所有科目")
    @GetMapping
    public ApiResponse<List<SubjectDTO>> getAllSubjects() {
        return ApiResponse.ok(subjectService.getAllSubjects());
    }

    @Operation(summary = "获取科目详情")
    @GetMapping("/{id}")
    public ApiResponse<SubjectDTO> getSubject(@PathVariable Long id) {
        return ApiResponse.ok(subjectService.getSubjectById(id));
    }

    @Operation(summary = "创建科目")
    @PostMapping
    public ApiResponse<SubjectDTO> createSubject(@Valid @RequestBody SubjectDTO dto) {
        return ApiResponse.ok(subjectService.createSubject(dto));
    }

    @Operation(summary = "更新科目")
    @PutMapping("/{id}")
    public ApiResponse<SubjectDTO> updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectDTO dto) {
        return ApiResponse.ok(subjectService.updateSubject(id, dto));
    }
}
