package com.study11408;

import com.study11408.dto.StudyPlanRequest;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.Subject;
import com.study11408.entity.Topic;
import com.study11408.entity.WrongAnswer;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeEdgeRepository;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.SubjectRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.AiClientService;
import com.study11408.service.SpacedRepetitionService;
import com.study11408.service.StudyPathService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test for {@link StudyPathService#generateAiPlan} — AI 学习计划生成入口。
 *
 * <p>断言要点：
 * <ul>
 *   <li>用户不存在 → BusinessException(NOT_FOUND)，不打 AI</li>
 *   <li>weeks 越界（0/53）→ BusinessException(BAD_REQUEST)，不打 AI</li>
 *   <li>goal 空白 → BusinessException(BAD_REQUEST)，不打 AI</li>
 *   <li>happy path：调用 AiClientService.generateStudyPlan，参数含 goal + weeks + 进度</li>
 *   <li>subjectId 为 null 时不应查 SubjectRepository</li>
 *   <li>subjectId 给定时应查并把 subject name 传下去</li>
 *   <li>错题节点应转换为薄弱主题 topic name 列表传下去</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class StudyPathServiceAiPlanUnitTest {

    @Mock private KnowledgeNodeRepository nodeRepository;
    @Mock private KnowledgeEdgeRepository edgeRepository;
    @Mock private StudyProgressRepository progressRepository;
    @Mock private UserRepository userRepository;
    @Mock private SpacedRepetitionService spacedRepetitionService;
    @Mock private SubjectRepository subjectRepository;
    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private AiClientService aiClientService;

    @InjectMocks private StudyPathService studyPathService;

    private StudyPlanRequest validReq;

    @BeforeEach
    void setUp() {
        validReq = new StudyPlanRequest(null, 12, "考 408 目标 130 分");
    }

    @Test
    void should_throw_when_user_not_found() {
        when(userRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> studyPathService.generateAiPlan(99L, validReq))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户不存在");

        verify(aiClientService, never())
                .generateStudyPlan(anyString(), anyInt(), any(), any(), any(), any());
    }

    @Test
    void should_throw_when_weeks_zero() {
        StudyPlanRequest req = new StudyPlanRequest(null, 0, "x");

        assertThatThrownBy(() -> studyPathService.generateAiPlan(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("weeks");

        verify(aiClientService, never())
                .generateStudyPlan(anyString(), anyInt(), any(), any(), any(), any());
    }

    @Test
    void should_throw_when_weeks_too_large() {
        StudyPlanRequest req = new StudyPlanRequest(null, 53, "x");

        assertThatThrownBy(() -> studyPathService.generateAiPlan(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("weeks");

        verify(aiClientService, never())
                .generateStudyPlan(anyString(), anyInt(), any(), any(), any(), any());
    }

    @Test
    void should_throw_when_goal_blank() {
        StudyPlanRequest req = new StudyPlanRequest(null, 4, "  ");

        assertThatThrownBy(() -> studyPathService.generateAiPlan(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("goal");

        verify(aiClientService, never())
                .generateStudyPlan(anyString(), anyInt(), any(), any(), any(), any());
    }

    @Test
    void happy_path_should_call_ai_with_goal_weeks_and_progress() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(nodeRepository.count()).thenReturn(200L);
        when(progressRepository.findByUserId(1L)).thenReturn(List.of(
                StudyProgress.builder().id(1L).masteryLevel(40).build(),
                StudyProgress.builder().id(2L).masteryLevel(60).build(),
                StudyProgress.builder().id(3L).masteryLevel(80).build()
        ));
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Map.of("plan", List.of()));

        Map<String, Object> result = studyPathService.generateAiPlan(1L, validReq);

        assertThat(result).containsKey("plan");
        verify(aiClientService).generateStudyPlan(
                eq("考 408 目标 130 分"),
                eq(12),
                eq(null),  // subjectId 为 null → subjectName 也是 null
                any(),
                eq(3L),    // studiedNodes
                eq(200L)); // totalNodes
        // subjectId null 时绝不查 SubjectRepository
        verify(subjectRepository, never()).findById(anyLong());
    }

    @Test
    void should_not_query_subject_repo_when_subject_id_null() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Map.of("plan", List.of()));

        StudyPlanRequest req = new StudyPlanRequest(null, 4, "x");
        studyPathService.generateAiPlan(1L, req);

        verify(subjectRepository, never()).findById(anyLong());
        // subjectName 应为 null 下发
        verify(aiClientService).generateStudyPlan(
                anyString(), anyInt(), eq(null), any(), any(), any());
    }

    @Test
    void should_query_subject_and_pass_subject_name_when_subject_id_given() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        Subject subject = Subject.builder()
                .id(7L).name("408 计算机专业基础").code("CS").build();
        when(subjectRepository.findById(7L)).thenReturn(Optional.of(subject));
        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Map.of("plan", List.of()));

        StudyPlanRequest req = new StudyPlanRequest(7L, 4, "x");
        studyPathService.generateAiPlan(1L, req);

        verify(subjectRepository).findById(7L);
        verify(aiClientService).generateStudyPlan(
                anyString(), anyInt(), eq("408 计算机专业基础"), any(), any(), any());
    }

    @Test
    void should_throw_when_subject_id_not_found() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(subjectRepository.findById(999L)).thenReturn(Optional.empty());

        StudyPlanRequest req = new StudyPlanRequest(999L, 4, "x");

        assertThatThrownBy(() -> studyPathService.generateAiPlan(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("学科不存在");

        verify(aiClientService, never())
                .generateStudyPlan(anyString(), anyInt(), any(), any(), any(), any());
    }

    @Test
    void should_extract_weak_topics_from_wrong_answers() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(nodeRepository.count()).thenReturn(0L);
        when(progressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        // 节点 10 错 5 次，节点 20 错 3 次 → 应取出 topic 名按频次倒序
        Topic topicA = Topic.builder().id(1L).name("数据结构-树").build();
        Topic topicB = Topic.builder().id(2L).name("操作系统-内存").build();
        KnowledgeNode node10 = KnowledgeNode.builder().id(10L).title("B+ 树").topic(topicA).build();
        KnowledgeNode node20 = KnowledgeNode.builder().id(20L).title("分页").topic(topicB).build();

        QuizQuestion q10 = QuizQuestion.builder().id(100L).nodeId(10L).build();
        QuizQuestion q20 = QuizQuestion.builder().id(200L).nodeId(20L).build();

        List<WrongAnswer> wrongs = List.of(
                WrongAnswer.builder().question(q10).build(),
                WrongAnswer.builder().question(q10).build(),
                WrongAnswer.builder().question(q10).build(),
                WrongAnswer.builder().question(q10).build(),
                WrongAnswer.builder().question(q10).build(),
                WrongAnswer.builder().question(q20).build(),
                WrongAnswer.builder().question(q20).build(),
                WrongAnswer.builder().question(q20).build()
        );
        when(wrongAnswerRepository.findByUserId(1L)).thenReturn(wrongs);
        lenient().when(nodeRepository.findById(10L)).thenReturn(Optional.of(node10));
        lenient().when(nodeRepository.findById(20L)).thenReturn(Optional.of(node20));

        when(aiClientService.generateStudyPlan(
                anyString(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Map.of("plan", List.of()));

        studyPathService.generateAiPlan(1L, validReq);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> weakCaptor = ArgumentCaptor.forClass(List.class);
        verify(aiClientService).generateStudyPlan(
                anyString(), anyInt(), any(), weakCaptor.capture(), any(), any());

        List<String> sentWeak = weakCaptor.getValue();
        assertThat(sentWeak).containsExactly("数据结构-树", "操作系统-内存");
    }
}
