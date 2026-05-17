package com.study11408.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.StudyPathDTO;
import com.study11408.dto.StudyPathWeekDTO;
import com.study11408.entity.StudyPath;
import com.study11408.entity.StudyPathWeek;
import com.study11408.exception.BusinessException;
import com.study11408.repository.StudyPathRepository;
import com.study11408.repository.StudyPathWeekRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 预置学习路径目录服务 —— 与 {@link StudyPathService}（用户私有 AI 计划）完全独立。
 *
 * <p>职责：列表（可按 subjectId 过滤）+ 详情（含分周 JSON 反序列化）。
 *
 * <p>JSONB 字段在 entity 是 String，转 DTO 时反序列化为 {@code List<String>}；
 * 解析失败采用 fail-soft 策略（返回空 list 而非抛异常），避免一条脏数据
 * 拖垮整个路径详情接口。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudyPathCatalogService {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};

    private final StudyPathRepository pathRepo;
    private final StudyPathWeekRepository weekRepo;
    private final ObjectMapper objectMapper;

    /**
     * 列表查询。{@code subjectId} 为 null 时返回全部路径（按 sortOrder/id 升序）；
     * 非 null 时按学科过滤。不包含 weeks 字段以减小 payload。
     */
    @Transactional(readOnly = true)
    public List<StudyPathDTO> list(Long subjectId) {
        List<StudyPath> paths = (subjectId == null)
                ? pathRepo.findAllByOrderBySortOrderAscIdAsc()
                : pathRepo.findBySubjectIdOrderBySortOrderAscIdAsc(subjectId);
        return paths.stream().map(this::toDtoBasic).collect(Collectors.toList());
    }

    /**
     * 详情查询：包含按 weekNo 升序的所有 week DTO。
     *
     * @throws BusinessException(NOT_FOUND) 路径 id 不存在
     */
    @Transactional(readOnly = true)
    public StudyPathDTO getDetail(Long pathId) {
        StudyPath path = pathRepo.findById(pathId)
                .orElseThrow(() -> new BusinessException("学习路径不存在", HttpStatus.NOT_FOUND));
        return toDtoWithWeeks(path);
    }

    private StudyPathDTO toDtoBasic(StudyPath p) {
        return StudyPathDTO.builder()
                .id(p.getId())
                .code(p.getCode())
                .title(p.getTitle())
                .description(p.getDescription())
                .subjectId(p.getSubjectId())
                .durationWeeks(p.getDurationWeeks())
                .difficulty(p.getDifficulty())
                .targetAudience(p.getTargetAudience())
                .totalHours(p.getTotalHours())
                .sortOrder(p.getSortOrder())
                .build();
    }

    private StudyPathDTO toDtoWithWeeks(StudyPath p) {
        List<StudyPathWeek> weeks = weekRepo.findByPathIdOrderByWeekNoAsc(p.getId());
        List<StudyPathWeekDTO> weekDtos = weeks.stream()
                .map(this::toWeekDto)
                .collect(Collectors.toList());

        StudyPathDTO dto = toDtoBasic(p);
        dto.setWeeks(weekDtos);
        return dto;
    }

    private StudyPathWeekDTO toWeekDto(StudyPathWeek w) {
        return StudyPathWeekDTO.builder()
                .id(w.getId())
                .weekNo(w.getWeekNo())
                .title(w.getTitle())
                .goal(w.getGoal())
                .dailyTasks(parseStringList(w.getDailyTasks(), "dailyTasks", w.getId()))
                .focusTopics(parseStringList(w.getFocusTopics(), "focusTopics", w.getId()))
                .resourceHints(parseStringList(w.getResourceHints(), "resourceHints", w.getId()))
                .build();
    }

    /**
     * 把 jsonb 字符串解析为 {@code List<String>}；
     * 解析失败或字段为空时返回 {@link Collections#emptyList()}（fail-soft）。
     */
    private List<String> parseStringList(String json, String field, Long weekId) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<String> parsed = objectMapper.readValue(json, STRING_LIST);
            return parsed != null ? parsed : Collections.emptyList();
        } catch (Exception e) {
            log.warn("study_path_weeks.{} 解析失败 weekId={} payload={} err={}",
                    field, weekId, json, e.getMessage());
            return Collections.emptyList();
        }
    }
}
