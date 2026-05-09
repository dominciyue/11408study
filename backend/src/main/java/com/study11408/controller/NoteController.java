package com.study11408.controller;

import com.study11408.dto.ApiResponse;
import com.study11408.dto.CreateNoteRequest;
import com.study11408.dto.NoteDTO;
import com.study11408.dto.UpdateNoteRequest;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.NoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "笔记系统", description = "笔记 CRUD，关联知识点")
@RestController
@RequestMapping("/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "获取笔记列表")
    @GetMapping
    public ApiResponse<List<NoteDTO>> list(HttpServletRequest request, @RequestParam(required = false) Long nodeId) {
        Long userId = getUserId(request);
        return ApiResponse.ok(noteService.list(userId, nodeId));
    }

    @Operation(summary = "创建笔记")
    @PostMapping
    public ApiResponse<NoteDTO> create(HttpServletRequest request, @Valid @RequestBody CreateNoteRequest body) {
        Long userId = getUserId(request);
        return ApiResponse.ok(noteService.create(userId, body));
    }

    @Operation(summary = "更新笔记")
    @PutMapping("/{id}")
    public ApiResponse<NoteDTO> update(HttpServletRequest request, @PathVariable Long id, @Valid @RequestBody UpdateNoteRequest body) {
        Long userId = getUserId(request);
        return ApiResponse.ok(noteService.update(userId, id, body));
    }

    @Operation(summary = "删除笔记")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(HttpServletRequest request, @PathVariable Long id) {
        Long userId = getUserId(request);
        noteService.delete(userId, id);
        return ApiResponse.ok();
    }

    private Long getUserId(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        return jwtTokenProvider.getUserId(token);
    }
}

