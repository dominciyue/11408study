package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.StudyPlanRequest;
import com.study11408.entity.StudyPlan;
import com.study11408.entity.User;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeEdgeRepository;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.StudyPlanRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.SubjectRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.AiClientService;
import com.study11408.service.SpacedRepetitionService;
import com.study11408.service.StudyPathService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test for AI 学习计划入库 v2 — generateAiPlan 持久化 +
 * listUserPlans / getUserPlan / deleteUserPlan ownership 校验。
 *
 * <p>断言要点：
 * <ul>
 *   <li>generateAiPlan happy path → 应 save 一条 StudyPlan（含正确字段）+ 返回 map 含 planId</li>
 *   <li>ai-service 返回 error → 不入库（不调 save），返回 map 不含 planId</li>
 *   <li>ai-service 返回空 plan → 不入库</li>
 *   <li>序列化失败时不阻断生成 —— map 仍返回，只是不带 planId（容错）</li>
 *   <li>listUserPlans 透传到 repo 的 findByUserIdOrderByCreatedAtDesc</li>
 *   <li>getUserPlan 找不到 → BusinessException(NOT_FOUND)</li>
 *   <li>getUserPlan happy → 返回 entity</li>
 *   <li>deleteUserPlan 找不到 → BusinessException(NOT_FOUND) 且不调 delete</li>
 *   <li>deleteUserPlan happy → 走 ownership 校验后 delete</li>
 * </ul>
 *
 * <p>用真 {@link ObjectMapper}（@Spy）而不是 mock，因为 plan_json 序列化是
 * 关键链路，且 Jackson 行为对 List/Map 完全可预期。
 */
@ExtendWith(MockitoExtension.class)
class StudyPathServiceAiPlanPersistenceUnitTest {

    @Mock private KnowledgeNodeRepository nodeRepository;
    @Mock private KnowledgeEdgeRepository edgeRepository;
    @Mock private StudyProgressRepository progressRepository;
    @Mock private UserRepository userRepository;
    @Mock private SpacedRepetitionService spacedRepetitionService;
    @Mock private SubjectRepository subjectRepository;
    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private AiClientService aiClientService;
    @Mock private StudyPlanRepository studyPlanRepository;
    @Spy  private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks private StudyPathService studyPathService;

    // ── generateAiPlan 持久化路径 ──────────────────────────────────────────────

    @Test
    void generateAiPlan_should_persist_StudyPlan_and_inject_planId() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.getReferenceById(1L)).thenReturn(User.builder().id(1L).build());
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        // ai-service 返回有效 plan
        Map<String, Object> aiResp = Map.of(
                "plan", List.of(
                        Map.of("week", 1, "title", "数据结构 - 线性表", "goals", List.of("熟悉链表")),
                        Map.of("week", 2, "title", "栈与队列", "goals", List.of("掌握栈应用"))),
                "summary", "12 周通关 408");
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any())).thenReturn(aiResp);
        // save 返回带 id 的实体
        when(studyPlanRepository.save(any(StudyPlan.class))).thenAnswer(inv -> {
            StudyPlan p = inv.getArgument(0);
            p.setId(42L);
            return p;
        });

        StudyPlanRequest req = new StudyPlanRequest(null, 12, "考 408 目标 130 分");
        Map<String, Object> result = studyPathService.generateAiPlan(1L, req);

        // 1) repo.save 被调用，且写入字段正确
        ArgumentCaptor<StudyPlan> captor = ArgumentCaptor.forClass(StudyPlan.class);
        verify(studyPlanRepository).save(captor.capture());
        StudyPlan saved = captor.getValue();
        assertThat(saved.getWeeks()).isEqualTo(12);
        assertThat(saved.getGoal()).isEqualTo("考 408 目标 130 分");
        assertThat(saved.getSummary()).isEqualTo("12 周通关 408");
        assertThat(saved.getSubjectId()).isNull();
        assertThat(saved.getUser()).isNotNull();
        assertThat(saved.getUser().getId()).isEqualTo(1L);
        // plan_json 含完整 plan 数组（验证序列化路径走通）
        assertThat(saved.getPlanJson()).contains("\"week\":1").contains("\"week\":2")
                .contains("数据结构");

        // 2) 返回 map 注入了 planId
        assertThat(result).containsEntry("planId", 42L);
        // 3) 原 plan / summary 字段保持兼容
        assertThat(result).containsKey("plan").containsKey("summary");
    }

    @Test
    void generateAiPlan_should_persist_subject_id_when_given() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.getReferenceById(1L)).thenReturn(User.builder().id(1L).build());
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(subjectRepository.findById(7L)).thenReturn(Optional.of(
                com.study11408.entity.Subject.builder().id(7L).name("408").code("CS").build()));
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any())).thenReturn(
                Map.of("plan", List.of(Map.of("week", 1, "title", "x"))));
        when(studyPlanRepository.save(any(StudyPlan.class))).thenAnswer(inv -> {
            StudyPlan p = inv.getArgument(0);
            p.setId(99L);
            return p;
        });

        StudyPlanRequest req = new StudyPlanRequest(7L, 4, "x");
        studyPathService.generateAiPlan(1L, req);

        ArgumentCaptor<StudyPlan> captor = ArgumentCaptor.forClass(StudyPlan.class);
        verify(studyPlanRepository).save(captor.capture());
        assertThat(captor.getValue().getSubjectId()).isEqualTo(7L);
    }

    @Test
    void generateAiPlan_should_NOT_persist_when_ai_returns_error() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Map.of("error", "AI服务暂不可用"));

        StudyPlanRequest req = new StudyPlanRequest(null, 4, "x");
        Map<String, Object> result = studyPathService.generateAiPlan(1L, req);

        verify(studyPlanRepository, never()).save(any());
        assertThat(result).doesNotContainKey("planId");
        assertThat(result).containsEntry("error", "AI服务暂不可用");
    }

    @Test
    void generateAiPlan_should_NOT_persist_when_plan_empty() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Map.of("plan", List.of()));

        StudyPlanRequest req = new StudyPlanRequest(null, 4, "x");
        Map<String, Object> result = studyPathService.generateAiPlan(1L, req);

        verify(studyPlanRepository, never()).save(any());
        assertThat(result).doesNotContainKey("planId");
    }

    @Test
    void generateAiPlan_should_swallow_persistence_error_and_still_return_plan() {
        // 入库失败不应阻断生成（容错）—— 用户体验上至少能展示这次 plan，
        // 只是不会进历史列表。
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.getReferenceById(1L)).thenReturn(User.builder().id(1L).build());
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Map.of("plan", List.of(Map.of("week", 1, "title", "x"))));
        when(studyPlanRepository.save(any(StudyPlan.class)))
                .thenThrow(new RuntimeException("DB down"));

        StudyPlanRequest req = new StudyPlanRequest(null, 4, "x");
        Map<String, Object> result = studyPathService.generateAiPlan(1L, req);

        assertThat(result).containsKey("plan");
        assertThat(result).doesNotContainKey("planId");  // 入库失败 → 不带 planId
    }

    // ── listUserPlans / getUserPlan / deleteUserPlan ──────────────────────────

    @Test
    void listUserPlans_should_delegate_to_repo() {
        StudyPlan p1 = StudyPlan.builder().id(1L).weeks(4).build();
        StudyPlan p2 = StudyPlan.builder().id(2L).weeks(8).build();
        when(studyPlanRepository.findByUserIdOrderByCreatedAtDesc(7L))
                .thenReturn(List.of(p2, p1));  // 最新在前

        List<StudyPlan> result = studyPathService.listUserPlans(7L);

        assertThat(result).extracting(StudyPlan::getId).containsExactly(2L, 1L);
        verify(studyPlanRepository).findByUserIdOrderByCreatedAtDesc(7L);
    }

    @Test
    void getUserPlan_should_throw_NOT_FOUND_when_missing() {
        when(studyPlanRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studyPathService.getUserPlan(7L, 99L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("学习计划不存在")
                .extracting("code").isEqualTo(404);
    }

    @Test
    void getUserPlan_should_return_entity_when_found() {
        StudyPlan p = StudyPlan.builder().id(99L).weeks(12).goal("g").planJson("[]").build();
        when(studyPlanRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.of(p));

        StudyPlan result = studyPathService.getUserPlan(7L, 99L);

        assertThat(result).isSameAs(p);
    }

    @Test
    void deleteUserPlan_should_throw_NOT_FOUND_when_missing_and_skip_delete() {
        when(studyPlanRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studyPathService.deleteUserPlan(7L, 99L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("学习计划不存在");

        verify(studyPlanRepository, never()).delete(any());
    }

    @Test
    void deleteUserPlan_should_delete_when_owned() {
        StudyPlan p = StudyPlan.builder().id(99L).weeks(4).planJson("[]").build();
        when(studyPlanRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.of(p));

        studyPathService.deleteUserPlan(7L, 99L);

        verify(studyPlanRepository).delete(p);
    }

    // ── 兼容性回归：planId 注入不破坏原 map 接口 ──────────────────────────────

    @Test
    void generateAiPlan_should_preserve_original_map_keys_and_add_planId() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.getReferenceById(1L)).thenReturn(User.builder().id(1L).build());
        when(nodeRepository.count()).thenReturn(100L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), eq(null), any(), any(), any()))
                .thenReturn(Map.of(
                        "plan", List.of(Map.of("week", 1, "title", "t")),
                        "summary", "S"));
        when(studyPlanRepository.save(any(StudyPlan.class))).thenAnswer(inv -> {
            StudyPlan p = inv.getArgument(0);
            p.setId(7L);
            return p;
        });

        Map<String, Object> result = studyPathService.generateAiPlan(
                1L, new StudyPlanRequest(null, 12, "g"));

        assertThat(result).containsKeys("plan", "summary", "planId");
        assertThat(result.get("planId")).isEqualTo(7L);
    }
}
