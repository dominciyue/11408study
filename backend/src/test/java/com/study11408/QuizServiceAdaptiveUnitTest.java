package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.Subject;
import com.study11408.entity.Topic;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.AiClientService;
import com.study11408.service.QuizService;
import com.study11408.service.WrongAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * QuizService.adaptiveGenerate 单测：bucket A→B→C 优先级、edge cases、user 校验。
 *
 * <p>用 LENIENT 是因为不同测试只 stub 用得到的 mock，避免 UnnecessaryStubbingException。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QuizServiceAdaptiveUnitTest {

    @Mock private QuizQuestionRepository questionRepository;
    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private UserRepository userRepository;
    @Mock private AiClientService aiClientService;
    @Mock private StudyProgressRepository progressRepository;
    @Mock private KnowledgeNodeRepository nodeRepository;
    @Mock private WrongAnswerService wrongAnswerService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private QuizService service;
    private static final long USER_ID = 1L;
    private static final long SUBJECT_ID = 4L; // 408

    @BeforeEach
    void setup() {
        service = new QuizService(
                questionRepository, wrongAnswerRepository, userRepository,
                aiClientService, objectMapper, progressRepository, nodeRepository,
                wrongAnswerService);
    }

    private static Subject subject(long id) {
        Subject s = new Subject();
        s.setId(id);
        return s;
    }

    private static Topic topic(long id, Subject s) {
        Topic t = new Topic();
        t.setId(id);
        t.setSubject(s);
        return t;
    }

    private static KnowledgeNode node(long id, Topic t, String title) {
        return KnowledgeNode.builder()
                .id(id).title(title).topic(t).difficulty("EASY").build();
    }

    private static StudyProgress progress(
            long nodeId, KnowledgeNode node, int mastery, LocalDateTime nextReview) {
        StudyProgress p = StudyProgress.builder()
                .node(node).masteryLevel(mastery).nextReview(nextReview).build();
        p.setNodeId(nodeId);
        return p;
    }

    @Test
    void should_throw_when_user_not_found() {
        when(userRepository.existsById(USER_ID)).thenReturn(false);
        assertThatThrownBy(() -> service.adaptiveGenerate(USER_ID, SUBJECT_ID, 10))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户不存在");
        verify(questionRepository, never()).findRandomInlineByNodeIds(any(), anyInt());
    }

    @Test
    void should_return_empty_when_count_is_zero_or_negative() {
        assertThat(service.adaptiveGenerate(USER_ID, SUBJECT_ID, 0)).isEmpty();
        assertThat(service.adaptiveGenerate(USER_ID, SUBJECT_ID, -5)).isEmpty();
        verify(userRepository, never()).existsById(any());
    }

    @Test
    void should_return_empty_when_no_progress_and_no_subject() {
        when(userRepository.existsById(USER_ID)).thenReturn(true);
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID)).thenReturn(List.of());
        // subject=null → bucket C 不填充
        List<QuizQuestion> result = service.adaptiveGenerate(USER_ID, null, 10);
        assertThat(result).isEmpty();
        verify(questionRepository, never()).findRandomInlineByNodeIds(any(), anyInt());
    }

    @Test
    void bucketA_due_for_review_takes_priority_over_low_mastery() {
        Subject s = subject(SUBJECT_ID);
        Topic t = topic(11L, s);
        KnowledgeNode n1 = node(101L, t, "due-now");
        KnowledgeNode n2 = node(102L, t, "low-mastery");

        LocalDateTime now = LocalDateTime.now();
        // n1: due 1h ago → bucket A
        // n2: not due (next review 2 days later) but mastery=10 → bucket B
        StudyProgress p1 = progress(101L, n1, 60, now.minusHours(1));
        StudyProgress p2 = progress(102L, n2, 10, now.plusDays(2));

        when(userRepository.existsById(USER_ID)).thenReturn(true);
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID))
                .thenReturn(List.of(p1, p2));
        when(nodeRepository.findByTopicSubjectId(SUBJECT_ID)).thenReturn(List.of(n1, n2));
        when(questionRepository.findRandomInlineByNodeIds(any(), anyInt()))
                .thenReturn(List.of());

        service.adaptiveGenerate(USER_ID, SUBJECT_ID, 10);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> captor = ArgumentCaptor.forClass(List.class);
        verify(questionRepository).findRandomInlineByNodeIds(captor.capture(), eq(10));
        List<Long> ids = captor.getValue();
        // n1 (bucket A) 排在 n2 (bucket B) 前
        assertThat(ids.indexOf(101L)).isLessThan(ids.indexOf(102L));
    }

    @Test
    void bucketC_new_nodes_appended_after_AB_when_subject_given() {
        Subject s = subject(SUBJECT_ID);
        Topic t = topic(11L, s);
        KnowledgeNode studied = node(201L, t, "studied-low");
        KnowledgeNode brandNew = node(202L, t, "never-touched");

        // 用户只学过 studied，掌握度 30 → bucket B
        StudyProgress p = progress(201L, studied, 30, null);

        when(userRepository.existsById(USER_ID)).thenReturn(true);
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID))
                .thenReturn(List.of(p));
        when(nodeRepository.findByTopicSubjectId(SUBJECT_ID))
                .thenReturn(List.of(studied, brandNew));
        when(questionRepository.findRandomInlineByNodeIds(any(), anyInt()))
                .thenReturn(List.of());

        service.adaptiveGenerate(USER_ID, SUBJECT_ID, 5);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> captor = ArgumentCaptor.forClass(List.class);
        verify(questionRepository).findRandomInlineByNodeIds(captor.capture(), eq(5));
        List<Long> ids = captor.getValue();
        assertThat(ids).contains(201L, 202L);
        assertThat(ids.indexOf(201L)).isLessThan(ids.indexOf(202L)); // B before C
    }

    @Test
    void should_filter_progress_by_subject_when_given() {
        Subject targetS = subject(SUBJECT_ID);
        Subject otherS = subject(99L);
        Topic targetT = topic(11L, targetS);
        Topic otherT = topic(99L, otherS);
        KnowledgeNode inSubject = node(301L, targetT, "in-target");
        KnowledgeNode otherSubject = node(302L, otherT, "in-other");

        LocalDateTime now = LocalDateTime.now();
        StudyProgress p1 = progress(301L, inSubject, 30, now.minusHours(1));
        StudyProgress p2 = progress(302L, otherSubject, 10, now.minusDays(1));

        when(userRepository.existsById(USER_ID)).thenReturn(true);
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID))
                .thenReturn(List.of(p1, p2));
        when(nodeRepository.findByTopicSubjectId(SUBJECT_ID))
                .thenReturn(List.of(inSubject));
        when(questionRepository.findRandomInlineByNodeIds(any(), anyInt()))
                .thenReturn(List.of());

        service.adaptiveGenerate(USER_ID, SUBJECT_ID, 10);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> captor = ArgumentCaptor.forClass(List.class);
        verify(questionRepository).findRandomInlineByNodeIds(captor.capture(), eq(10));
        // 只应包含 SUBJECT_ID 下的 301，不应有跨学科的 302
        assertThat(captor.getValue()).contains(301L).doesNotContain(302L);
    }

    @Test
    void earliest_due_in_bucketA_comes_first() {
        Subject s = subject(SUBJECT_ID);
        Topic t = topic(11L, s);
        KnowledgeNode older = node(401L, t, "older-due");
        KnowledgeNode newer = node(402L, t, "newer-due");

        LocalDateTime now = LocalDateTime.now();
        StudyProgress pOlder = progress(401L, older, 50, now.minusDays(3));
        StudyProgress pNewer = progress(402L, newer, 50, now.minusHours(1));

        when(userRepository.existsById(USER_ID)).thenReturn(true);
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID))
                .thenReturn(List.of(pNewer, pOlder));
        when(questionRepository.findRandomInlineByNodeIds(any(), anyInt()))
                .thenReturn(List.of());

        service.adaptiveGenerate(USER_ID, null, 10);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> captor = ArgumentCaptor.forClass(List.class);
        verify(questionRepository).findRandomInlineByNodeIds(captor.capture(), eq(10));
        List<Long> ids = captor.getValue();
        assertThat(ids.indexOf(401L)).isLessThan(ids.indexOf(402L)); // 3 天前到期排在 1 小时前
    }
}
