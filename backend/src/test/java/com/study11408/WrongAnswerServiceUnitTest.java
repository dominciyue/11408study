package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.SimilarQuestionsResponse;
import com.study11408.dto.WrongAnswerDTO;
import com.study11408.dto.WrongAnswerGroupDTO;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.Subject;
import com.study11408.entity.Topic;
import com.study11408.entity.User;
import com.study11408.entity.WrongAnswer;
import com.study11408.exception.BusinessException;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.AiClientService;
import com.study11408.service.AiRateLimiter;
import com.study11408.service.SpacedRepetitionService;
import com.study11408.service.WrongAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * WrongAnswerService 单测 — 覆盖错题闭环关键场景：
 *
 * <ul>
 *   <li>累计错 1 次 → 不入队、不 markEnqueued</li>
 *   <li>累计错 2 次 → 入队 + markEnqueued</li>
 *   <li>已入队后再答错 → 不再调入队（幂等：count IS NULL 返回 < 2）</li>
 *   <li>相似题：库内充足 → 不调 AI</li>
 *   <li>相似题：库内不足 → AI 兜底拼接</li>
 *   <li>相似题：AI 错误 → aiAvailable=false 不抛</li>
 *   <li>resolve 越权 → BusinessException NOT_FOUND</li>
 *   <li>resolve 幂等：已解决再调不重复 save</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WrongAnswerServiceUnitTest {

    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private QuizQuestionRepository quizQuestionRepository;
    @Mock private SpacedRepetitionService spacedRepetitionService;
    @Mock private AiClientService aiClientService;
    @Mock private AiRateLimiter aiRateLimiter;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private WrongAnswerService service;

    private static final long USER_ID = 7L;
    private static final long QUESTION_ID = 100L;
    private static final long NODE_ID = 50L;
    private static final long TOPIC_ID = 10L;
    private static final long SUBJECT_ID = 4L;

    @BeforeEach
    void setup() {
        service = new WrongAnswerService(
                wrongAnswerRepository, quizQuestionRepository,
                spacedRepetitionService, aiClientService, aiRateLimiter, objectMapper);
    }

    // ---------- helpers ----------

    private static User user() {
        User u = new User();
        u.setId(USER_ID);
        return u;
    }

    private static Subject subject() {
        Subject s = new Subject();
        s.setId(SUBJECT_ID);
        s.setName("408");
        s.setCode("CS408");
        return s;
    }

    private static Topic topic() {
        Topic t = new Topic();
        t.setId(TOPIC_ID);
        t.setName("操作系统");
        t.setSubject(subject());
        return t;
    }

    private static KnowledgeNode node() {
        return KnowledgeNode.builder()
                .id(NODE_ID).title("进程调度")
                .content("进程调度算法")
                .difficulty("MEDIUM")
                .topic(topic())
                .build();
    }

    private static QuizQuestion question(long id) {
        QuizQuestion q = QuizQuestion.builder()
                .id(id)
                .content("题目内容")
                .answer("A")
                .questionType("CHOICE")
                .options("[\"A\",\"B\",\"C\",\"D\"]")
                .node(node())
                .build();
        q.setNodeId(NODE_ID);
        return q;
    }

    // ---------- Flow A: 入队累计 ----------

    @Test
    void recordAndMaybeEnqueue_first_wrong_does_NOT_enqueue() {
        when(wrongAnswerRepository
                .countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(USER_ID, QUESTION_ID))
                .thenReturn(1L);  // 第 1 次（本次刚 save 完）

        service.recordAndMaybeEnqueue(user(), question(QUESTION_ID), "B");

        verify(wrongAnswerRepository).save(any(WrongAnswer.class));
        verify(spacedRepetitionService, never()).enqueueWrongQuestion(any(), any());
        verify(wrongAnswerRepository, never()).markEnqueued(any(), any(), any());
    }

    @Test
    void recordAndMaybeEnqueue_second_wrong_triggers_enqueue_and_mark() {
        when(wrongAnswerRepository
                .countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(USER_ID, QUESTION_ID))
                .thenReturn(2L);  // 第 2 次 → 触发
        when(wrongAnswerRepository.markEnqueued(eq(USER_ID), eq(QUESTION_ID), any()))
                .thenReturn(2);

        service.recordAndMaybeEnqueue(user(), question(QUESTION_ID), "B");

        verify(wrongAnswerRepository).save(any(WrongAnswer.class));
        verify(spacedRepetitionService).enqueueWrongQuestion(USER_ID, NODE_ID);
        verify(wrongAnswerRepository).markEnqueued(eq(USER_ID), eq(QUESTION_ID), any());
    }

    @Test
    void recordAndMaybeEnqueue_after_enqueued_count_returns_lt_threshold() {
        // 已入队过 → enqueued_at IS NULL 的计数会 < 2（因为之前 markEnqueued 标了）
        when(wrongAnswerRepository
                .countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(USER_ID, QUESTION_ID))
                .thenReturn(1L);

        service.recordAndMaybeEnqueue(user(), question(QUESTION_ID), "B");

        verify(spacedRepetitionService, never()).enqueueWrongQuestion(any(), any());
    }

    @Test
    void recordAndMaybeEnqueue_null_question_is_noop() {
        service.recordAndMaybeEnqueue(user(), null, "B");
        verify(wrongAnswerRepository, never()).save(any());
    }

    @Test
    void recordAndMaybeEnqueue_enqueue_throws_does_not_break_flow() {
        when(wrongAnswerRepository
                .countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(USER_ID, QUESTION_ID))
                .thenReturn(2L);
        // 模拟入队失败 — 不应该抛上来
        org.mockito.Mockito.doThrow(new RuntimeException("db blip"))
                .when(spacedRepetitionService).enqueueWrongQuestion(any(), any());

        // 不抛
        service.recordAndMaybeEnqueue(user(), question(QUESTION_ID), "B");

        verify(wrongAnswerRepository).save(any());
        verify(spacedRepetitionService).enqueueWrongQuestion(USER_ID, NODE_ID);
    }

    // ---------- Flow B: 相似题 ----------

    @Test
    void findSimilar_when_db_pool_meets_limit_does_not_call_AI() {
        WrongAnswer wa = new WrongAnswer();
        wa.setId(1L);
        wa.setQuestion(question(QUESTION_ID));
        wa.setUserId(USER_ID);

        when(wrongAnswerRepository.findByIdAndUserId(1L, USER_ID)).thenReturn(Optional.of(wa));

        // 同 node 有 6 道题（含本题）→ 去掉本题剩 5 道，正好等于 limit
        List<QuizQuestion> pool = new ArrayList<>();
        pool.add(question(QUESTION_ID));  // 本题本身
        for (long i = 200; i < 205; i++) pool.add(question(i));
        when(quizQuestionRepository.findByNodeId(NODE_ID)).thenReturn(pool);

        SimilarQuestionsResponse resp = service.findSimilar(USER_ID, 1L, 5);

        assertThat(resp.getItems()).hasSize(5);
        assertThat(resp.getItems()).allMatch(it -> !it.isGenerated());
        assertThat(resp.getTotalFromDb()).isEqualTo(5);
        assertThat(resp.getTotalGenerated()).isEqualTo(0);
        assertThat(resp.isAiAvailable()).isTrue();
        // 关键：AI 不被调
        verify(aiClientService, never()).generateQuiz(any(), any(), any(), anyInt(), any());
        verify(aiRateLimiter, never()).check(any());
    }

    @Test
    void findSimilar_when_db_insufficient_calls_AI_fallback() {
        WrongAnswer wa = new WrongAnswer();
        wa.setId(2L);
        wa.setQuestion(question(QUESTION_ID));
        wa.setUserId(USER_ID);

        when(wrongAnswerRepository.findByIdAndUserId(2L, USER_ID)).thenReturn(Optional.of(wa));
        // 库内只有 1 道相似（本题）→ 同 node/topic/subject 都返空，需要 AI 5 道
        when(quizQuestionRepository.findByNodeId(NODE_ID)).thenReturn(List.of(question(QUESTION_ID)));
        when(quizQuestionRepository.findByNodeTopicId(TOPIC_ID)).thenReturn(List.of());
        when(quizQuestionRepository.findByNodeTopicSubjectId(SUBJECT_ID)).thenReturn(List.of());

        // AI 返回 3 道
        List<Map<String, Object>> aiQuestions = List.of(
                Map.of("question", "AI 题 1", "question_type", "CHOICE",
                        "answer", "A", "explanation", "解析 1",
                        "options", List.of("A", "B", "C", "D")),
                Map.of("question", "AI 题 2", "question_type", "CHOICE",
                        "answer", "B", "explanation", "解析 2",
                        "options", List.of("A", "B", "C", "D")),
                Map.of("question", "AI 题 3", "question_type", "CHOICE",
                        "answer", "C", "explanation", "解析 3",
                        "options", List.of("A", "B", "C", "D")));
        when(aiClientService.generateQuiz(anyString(), anyString(), anyString(), eq(5), any()))
                .thenReturn(Map.of("questions", aiQuestions));

        SimilarQuestionsResponse resp = service.findSimilar(USER_ID, 2L, 5);

        verify(aiRateLimiter).check(USER_ID);
        verify(aiClientService).generateQuiz(anyString(), anyString(), eq("CHOICE"), eq(5), any());
        assertThat(resp.getTotalFromDb()).isEqualTo(0);
        assertThat(resp.getTotalGenerated()).isEqualTo(3);
        assertThat(resp.getItems()).hasSize(3);
        assertThat(resp.getItems()).allMatch(SimilarQuestionsResponse.SimilarItem::isGenerated);
        assertThat(resp.isAiAvailable()).isTrue();
        assertThat(resp.getSource()).isEqualTo("AI_FALLBACK");
    }

    @Test
    void findSimilar_when_AI_returns_error_does_not_throw() {
        WrongAnswer wa = new WrongAnswer();
        wa.setId(3L);
        wa.setQuestion(question(QUESTION_ID));
        wa.setUserId(USER_ID);

        when(wrongAnswerRepository.findByIdAndUserId(3L, USER_ID)).thenReturn(Optional.of(wa));
        when(quizQuestionRepository.findByNodeId(NODE_ID)).thenReturn(List.of(question(QUESTION_ID)));
        when(quizQuestionRepository.findByNodeTopicId(TOPIC_ID)).thenReturn(List.of());
        when(quizQuestionRepository.findByNodeTopicSubjectId(SUBJECT_ID)).thenReturn(List.of());
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("error", "AI 调用失败"));

        SimilarQuestionsResponse resp = service.findSimilar(USER_ID, 3L, 5);

        assertThat(resp.isAiAvailable()).isFalse();
        assertThat(resp.getTotalGenerated()).isEqualTo(0);
        assertThat(resp.getTotalFromDb()).isEqualTo(0);
    }

    @Test
    void findSimilar_unauthorized_throws_business_exception() {
        when(wrongAnswerRepository.findByIdAndUserId(999L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findSimilar(USER_ID, 999L, 5))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("错题不存在或无权限");
    }

    // ---------- Flow C: 分组 ----------

    @Test
    void listGroupedByNode_groups_by_node_with_counts() {
        WrongAnswer a = WrongAnswer.builder()
                .id(1L).question(question(101L))
                .answeredAt(LocalDateTime.now().minusHours(2))
                .resolved(false).build();
        WrongAnswer b = WrongAnswer.builder()
                .id(2L).question(question(102L))
                .answeredAt(LocalDateTime.now().minusHours(1))
                .enqueuedAt(LocalDateTime.now())
                .resolved(false).build();
        when(wrongAnswerRepository.findByUserIdAndResolvedFalse(USER_ID))
                .thenReturn(List.of(a, b));

        List<WrongAnswerGroupDTO> groups = service.listGroupedByNode(USER_ID);

        // 都在同一 node (101 和 102 共享同一 node id 50)
        assertThat(groups).hasSize(1);
        assertThat(groups.get(0).getNodeId()).isEqualTo(NODE_ID);
        assertThat(groups.get(0).getWrongCount()).isEqualTo(2);
        assertThat(groups.get(0).isEnqueued()).isTrue(); // 任意一条 enqueued 即 true
    }

    // ---------- resolve ----------

    @Test
    void resolve_unauthorized_throws() {
        when(wrongAnswerRepository.findByIdAndUserId(999L, USER_ID)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.resolve(USER_ID, 999L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void resolve_already_resolved_does_not_re_save() {
        WrongAnswer w = WrongAnswer.builder()
                .id(5L).question(question(QUESTION_ID))
                .resolved(true).build();
        when(wrongAnswerRepository.findByIdAndUserId(5L, USER_ID)).thenReturn(Optional.of(w));

        WrongAnswerDTO dto = service.resolve(USER_ID, 5L);
        assertThat(dto.getResolved()).isTrue();
        verify(wrongAnswerRepository, never()).save(any());
    }

    @Test
    void resolve_sets_resolved_true_and_saves() {
        WrongAnswer w = WrongAnswer.builder()
                .id(6L).question(question(QUESTION_ID))
                .resolved(false).build();
        when(wrongAnswerRepository.findByIdAndUserId(6L, USER_ID)).thenReturn(Optional.of(w));

        service.resolve(USER_ID, 6L);
        verify(wrongAnswerRepository, times(1)).save(w);
        assertThat(w.getResolved()).isTrue();
    }
}
