package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.Topic;
import com.study11408.entity.Subject;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.AiClientService;
import com.study11408.service.QuizService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * QuizService.seedSubjectQuestions 单测：
 * - 参数校验：countPerNode / maxNodes 越界 / 非法 type → BAD_REQUEST
 * - 学科无节点 → totalNodes=0 安全返回
 * - 命中 maxNodes 上限：超出部分不处理
 * - skipExisting=true：已有题目的节点被跳过（skipped++）
 * - skipExisting=false：所有节点都处理
 * - 单节点失败不中断批次（counter 正确）
 * - happy path：generated 数累加正确
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QuizServiceSeedSubjectUnitTest {

    @Mock private QuizQuestionRepository questionRepository;
    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private UserRepository userRepository;
    @Mock private AiClientService aiClientService;
    @Mock private StudyProgressRepository progressRepository;
    @Mock private KnowledgeNodeRepository nodeRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private QuizService service;

    @BeforeEach
    void setup() {
        service = new QuizService(
                questionRepository, wrongAnswerRepository, userRepository,
                aiClientService, objectMapper, progressRepository, nodeRepository);
    }

    private static KnowledgeNode mkNode(long id, String title) {
        Subject s = new Subject(); s.setId(4L);
        Topic t = new Topic(); t.setId(1L); t.setSubject(s);
        return KnowledgeNode.builder().id(id).title(title).content("c").topic(t).build();
    }

    @Test
    void should_throw_when_count_per_node_out_of_range() {
        assertThatThrownBy(() -> service.seedSubjectQuestions(4L, 0, "CHOICE", 5, true))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("code", HttpStatus.BAD_REQUEST.value());
        assertThatThrownBy(() -> service.seedSubjectQuestions(4L, 21, "CHOICE", 5, true))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("code", HttpStatus.BAD_REQUEST.value());
    }

    @Test
    void should_throw_when_max_nodes_out_of_range() {
        assertThatThrownBy(() -> service.seedSubjectQuestions(4L, 5, "CHOICE", 0, true))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.seedSubjectQuestions(4L, 5, "CHOICE", 51, true))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void should_throw_when_type_invalid() {
        assertThatThrownBy(() -> service.seedSubjectQuestions(4L, 5, "GIBBERISH", 5, true))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("code", HttpStatus.BAD_REQUEST.value());
    }

    @Test
    void should_return_zero_summary_when_subject_has_no_nodes() {
        when(nodeRepository.findByTopicSubjectId(4L)).thenReturn(List.of());

        Map<String, Object> r = service.seedSubjectQuestions(4L, 5, "CHOICE", 10, true);

        assertThat(r).containsEntry("totalNodes", 0);
        assertThat(r).containsEntry("processed", 0);
        verify(aiClientService, never()).generateQuiz(any(), any(), any(), anyInt(), any());
    }

    @Test
    void should_cap_processed_at_max_nodes() {
        // 5 nodes, maxNodes=2 → 只处理前 2 个
        List<KnowledgeNode> nodes = new ArrayList<>();
        for (long i = 1; i <= 5; i++) nodes.add(mkNode(i, "n" + i));
        when(nodeRepository.findByTopicSubjectId(4L)).thenReturn(nodes);
        // skipExisting 默认 true，但全部节点都没题
        when(questionRepository.findByNodeId(any())).thenReturn(List.of());
        // mock generateAndSaveForNode 路径：findById + ai 返回 1 题
        for (long i = 1; i <= 5; i++) {
            when(nodeRepository.findById(i)).thenReturn(Optional.of(mkNode(i, "n" + i)));
        }
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of(Map.of(
                        "question", "Q",
                        "question_type", "CHOICE",
                        "options", List.of("A", "B"),
                        "answer", "A",
                        "explanation", "ex"))));
        when(questionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> r = service.seedSubjectQuestions(4L, 1, "CHOICE", 2, true);

        assertThat(r).containsEntry("totalNodes", 5);
        assertThat(r).containsEntry("processed", 2);
        assertThat(r).containsEntry("succeeded", 2);
        assertThat(r).containsEntry("totalQuestionsGenerated", 2);
        verify(aiClientService, times(2)).generateQuiz(any(), any(), any(), anyInt(), any());
    }

    @Test
    void should_skip_existing_when_flag_true() {
        // 3 nodes; node 1 已有题 → 跳过；node 2/3 处理
        List<KnowledgeNode> nodes = List.of(mkNode(1, "n1"), mkNode(2, "n2"), mkNode(3, "n3"));
        when(nodeRepository.findByTopicSubjectId(4L)).thenReturn(nodes);
        when(questionRepository.findByNodeId(1L))
                .thenReturn(List.of(QuizQuestion.builder().id(99L).build()));
        when(questionRepository.findByNodeId(2L)).thenReturn(List.of());
        when(questionRepository.findByNodeId(3L)).thenReturn(List.of());
        when(nodeRepository.findById(2L)).thenReturn(Optional.of(mkNode(2, "n2")));
        when(nodeRepository.findById(3L)).thenReturn(Optional.of(mkNode(3, "n3")));
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of()));

        Map<String, Object> r = service.seedSubjectQuestions(4L, 5, "CHOICE", 10, true);

        assertThat(r).containsEntry("skipped", 1);
        assertThat(r).containsEntry("processed", 2);
        verify(aiClientService, times(2)).generateQuiz(any(), any(), any(), anyInt(), any());
    }

    @Test
    void should_process_all_when_skip_existing_false() {
        List<KnowledgeNode> nodes = List.of(mkNode(1, "n1"), mkNode(2, "n2"));
        when(nodeRepository.findByTopicSubjectId(4L)).thenReturn(nodes);
        // node 1 已有题但 skipExisting=false 应忽略
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(mkNode(1, "n1")));
        when(nodeRepository.findById(2L)).thenReturn(Optional.of(mkNode(2, "n2")));
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of()));

        Map<String, Object> r = service.seedSubjectQuestions(4L, 5, "CHOICE", 10, false);

        assertThat(r).containsEntry("skipped", 0);
        assertThat(r).containsEntry("processed", 2);
        verify(questionRepository, never()).findByNodeId(any());
    }

    @Test
    void single_node_failure_should_not_break_batch() {
        // node 1 → ai 抛异常；node 2 → 正常生成
        List<KnowledgeNode> nodes = List.of(mkNode(1, "n1"), mkNode(2, "n2"));
        when(nodeRepository.findByTopicSubjectId(4L)).thenReturn(nodes);
        when(questionRepository.findByNodeId(any())).thenReturn(List.of());
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(mkNode(1, "n1")));
        when(nodeRepository.findById(2L)).thenReturn(Optional.of(mkNode(2, "n2")));
        when(aiClientService.generateQuiz(any(), eq("c"), any(), anyInt(), any()))
                .thenThrow(new RuntimeException("ai down"))
                .thenReturn(Map.of("questions", List.of(Map.of(
                        "question", "Q", "question_type", "CHOICE",
                        "options", List.of("A", "B"), "answer", "A", "explanation", "ex"))));
        when(questionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> r = service.seedSubjectQuestions(4L, 1, "CHOICE", 10, true);

        assertThat(r).containsEntry("processed", 2);
        assertThat(r).containsEntry("succeeded", 1);
        assertThat(r).containsEntry("failed", 1);
    }

    @Test
    void duration_ms_should_be_present_and_non_negative() {
        when(nodeRepository.findByTopicSubjectId(4L)).thenReturn(List.of());
        Map<String, Object> r = service.seedSubjectQuestions(4L, 5, "CHOICE", 10, true);
        Object dur = r.get("durationMs");
        assertThat(dur).isInstanceOf(Number.class);
        assertThat(((Number) dur).longValue()).isGreaterThanOrEqualTo(0L);
    }
}
