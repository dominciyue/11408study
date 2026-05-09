package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

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
 * QuizService.generateAndSaveForNode 单测：覆盖
 * - count <= 0 / questionType 非法 → 静默 error 返回（不抛）
 * - 节点不存在 → BusinessException(NOT_FOUND)
 * - ai-service 返回 error / 空 questions → 静默 error 返回
 * - happy path：保存到 DB，options list 序列化成 JSON 字符串
 * - TRUE_FALSE 题型 options=null 不抛异常
 * - 单条题目缺关键字段（answer/question 为空）→ 跳过该条不影响其他
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QuizServiceGenerateForNodeUnitTest {

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

    @Test
    void should_return_error_when_count_zero_or_negative() {
        Map<String, Object> r1 = service.generateAndSaveForNode(1L, 0, "CHOICE", null);
        Map<String, Object> r2 = service.generateAndSaveForNode(1L, -3, "CHOICE", null);

        assertThat(r1).containsEntry("generated", 0);
        assertThat(r1.get("error")).asString().contains("count");
        assertThat(r2.get("error")).asString().contains("count");
        verify(aiClientService, never()).generateQuiz(any(), any(), any(), anyInt(), any());
    }

    @Test
    void should_return_error_when_question_type_invalid() {
        Map<String, Object> r = service.generateAndSaveForNode(1L, 5, "GIBBERISH", null);
        assertThat(r).containsEntry("generated", 0);
        assertThat(r.get("error")).asString().contains("CHOICE");
        verify(aiClientService, never()).generateQuiz(any(), any(), any(), anyInt(), any());
    }

    @Test
    void should_throw_when_node_not_found() {
        when(nodeRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.generateAndSaveForNode(99L, 5, "CHOICE", null))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("code", HttpStatus.NOT_FOUND.value());
    }

    @Test
    void should_return_error_when_ai_service_returns_error() {
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("t").content("c").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("error", "AI服务暂不可用"));

        Map<String, Object> r = service.generateAndSaveForNode(1L, 5, "CHOICE", null);

        assertThat(r).containsEntry("generated", 0);
        assertThat(r.get("error")).asString().contains("AI");
        verify(questionRepository, never()).save(any());
    }

    @Test
    void should_return_error_when_ai_returns_empty_questions() {
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("t").content("c").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of()));

        Map<String, Object> r = service.generateAndSaveForNode(1L, 5, "CHOICE", null);

        assertThat(r).containsEntry("generated", 0);
        verify(questionRepository, never()).save(any());
    }

    @Test
    void should_save_choice_questions_with_options_serialized() throws Exception {
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("栈").content("LIFO").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        Map<String, Object> q1 = Map.of(
                "question", "栈的特性？",
                "question_type", "CHOICE",
                "options", List.of("A. FIFO", "B. LIFO", "C. 随机", "D. 双端"),
                "answer", "B",
                "explanation", "栈是后进先出"
        );
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of(q1)));
        when(questionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> r = service.generateAndSaveForNode(1L, 1, "CHOICE", "EASY");

        assertThat(r).containsEntry("generated", 1);
        ArgumentCaptor<QuizQuestion> captor = ArgumentCaptor.forClass(QuizQuestion.class);
        verify(questionRepository).save(captor.capture());
        QuizQuestion saved = captor.getValue();
        assertThat(saved.getContent()).isEqualTo("栈的特性？");
        assertThat(saved.getQuestionType()).isEqualTo("CHOICE");
        assertThat(saved.getAnswer()).isEqualTo("B");
        assertThat(saved.getExplanation()).isEqualTo("栈是后进先出");
        assertThat(saved.getSource()).isEqualTo("ai-generated");
        // options 应被序列化为 JSON 字符串
        @SuppressWarnings("unchecked")
        List<String> roundTrip = (List<String>) objectMapper.readValue(saved.getOptions(), List.class);
        assertThat(roundTrip).containsExactly("A. FIFO", "B. LIFO", "C. 随机", "D. 双端");
    }

    @Test
    void should_handle_true_false_with_null_options() {
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("t").content("c").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        Map<String, Object> q = new java.util.HashMap<>();
        q.put("question", "栈是先进先出?");
        q.put("question_type", "TRUE_FALSE");
        q.put("answer", "错误");
        q.put("explanation", "栈是后进先出");
        q.put("options", null);
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of(q)));
        when(questionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> r = service.generateAndSaveForNode(1L, 1, "TRUE_FALSE", null);

        assertThat(r).containsEntry("generated", 1);
        ArgumentCaptor<QuizQuestion> captor = ArgumentCaptor.forClass(QuizQuestion.class);
        verify(questionRepository).save(captor.capture());
        assertThat(captor.getValue().getOptions()).isNull();
        assertThat(captor.getValue().getQuestionType()).isEqualTo("TRUE_FALSE");
    }

    @Test
    void should_skip_malformed_question_but_save_others() {
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("t").content("c").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        Map<String, Object> good = Map.of(
                "question", "Q1", "question_type", "CHOICE",
                "options", List.of("A", "B"), "answer", "A", "explanation", "ex");
        Map<String, Object> bad = new java.util.HashMap<>();
        bad.put("question", "");  // empty → skip
        bad.put("answer", "X");
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of(good, bad)));
        when(questionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> r = service.generateAndSaveForNode(1L, 2, "CHOICE", null);

        assertThat(r).containsEntry("generated", 1);
        verify(questionRepository, times(1)).save(any());
    }

    @Test
    void should_normalize_lowercase_question_type() {
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("t").content("c").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        when(aiClientService.generateQuiz(any(), any(), eq("CHOICE"), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of()));

        // 传 "choice" 小写应规整为 "CHOICE" 下发到 ai-service
        service.generateAndSaveForNode(1L, 5, "choice", null);

        verify(aiClientService).generateQuiz(any(), any(), eq("CHOICE"), anyInt(), any());
    }

    @Test
    void should_cap_count_at_20() {
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("t").content("c").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        when(aiClientService.generateQuiz(any(), any(), any(), anyInt(), any()))
                .thenReturn(Map.of("questions", List.of()));

        service.generateAndSaveForNode(1L, 100, "CHOICE", null);

        // 应被截到 20
        verify(aiClientService).generateQuiz(any(), any(), any(), eq(20), any());
    }
}
