package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.ChatMessageDTO;
import com.study11408.dto.QuizAiExplainRequest;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.exception.BusinessException;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.UserRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.AiClientService;
import com.study11408.service.QuizService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test for {@link QuizService#explainWithAi} — AI 启发式讲题入口。
 *
 * <p>断言要点：
 * <ul>
 *   <li>找不到用户时抛 BusinessException(NOT_FOUND)，不打 AI</li>
 *   <li>找不到题目时抛 BusinessException(NOT_FOUND)，不打 AI</li>
 *   <li>题目存在 + options JSON 合法时，应解析为 List 并下发</li>
 *   <li>题目无 options 时不应注入 options 键</li>
 *   <li>history 非空时应映射并下发；为空/null 时不下发</li>
 *   <li>关联的 KnowledgeNode 应作为 knowledge_node 上下文下发</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class QuizServiceAiExplainUnitTest {

    @Mock private QuizQuestionRepository questionRepository;
    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private UserRepository userRepository;
    @Mock private AiClientService aiClientService;
    @Mock private com.study11408.repository.StudyProgressRepository progressRepository;
    @Mock private com.study11408.repository.KnowledgeNodeRepository nodeRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private QuizService service;

    @BeforeEach
    void setup() {
        service = new QuizService(
                questionRepository, wrongAnswerRepository, userRepository,
                aiClientService, objectMapper, progressRepository, nodeRepository);
    }

    @Test
    void should_throw_when_user_not_found() {
        when(userRepository.existsById(99L)).thenReturn(false);

        QuizAiExplainRequest req = new QuizAiExplainRequest("A", null);
        assertThatThrownBy(() -> service.explainWithAi(99L, 1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户不存在");

        verify(aiClientService, never()).explainQuestion(any(), anyString(), any(), any());
    }

    @Test
    void should_throw_when_question_not_found() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(questionRepository.findById(42L)).thenReturn(Optional.empty());

        QuizAiExplainRequest req = new QuizAiExplainRequest("A", null);
        assertThatThrownBy(() -> service.explainWithAi(1L, 42L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("题目不存在");

        verify(aiClientService, never()).explainQuestion(any(), anyString(), any(), any());
    }

    @Test
    void should_parse_options_json_and_pass_to_ai_service() {
        when(userRepository.existsById(1L)).thenReturn(true);
        QuizQuestion q = QuizQuestion.builder()
                .id(7L)
                .content("题目")
                .questionType("CHOICE")
                .options("[\"A. foo\",\"B. bar\",\"C. baz\",\"D. qux\"]")
                .answer("B")
                .explanation("解释...")
                .build();
        when(questionRepository.findById(7L)).thenReturn(Optional.of(q));
        when(aiClientService.explainQuestion(any(), anyString(), any(), any()))
                .thenReturn(Map.of("reply", "AI 回复"));

        QuizAiExplainRequest req = new QuizAiExplainRequest("A", null);
        Map<String, Object> result = service.explainWithAi(1L, 7L, req);

        assertThat(result).containsEntry("reply", "AI 回复");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> qCaptor = ArgumentCaptor.forClass(Map.class);
        verify(aiClientService).explainQuestion(qCaptor.capture(), eq("A"), any(), any());

        Map<String, Object> sent = qCaptor.getValue();
        assertThat(sent).containsEntry("content", "题目");
        assertThat(sent).containsEntry("correct_answer", "B");
        assertThat(sent).containsEntry("question_type", "CHOICE");
        assertThat(sent).containsEntry("stored_explanation", "解释...");
        @SuppressWarnings("unchecked")
        List<String> opts = (List<String>) sent.get("options");
        assertThat(opts).containsExactly("A. foo", "B. bar", "C. baz", "D. qux");
    }

    @Test
    void should_omit_options_when_not_present() {
        when(userRepository.existsById(1L)).thenReturn(true);
        QuizQuestion q = QuizQuestion.builder()
                .id(8L)
                .content("判断题")
                .questionType("TRUE_FALSE")
                .answer("正确")
                .build();
        when(questionRepository.findById(8L)).thenReturn(Optional.of(q));
        when(aiClientService.explainQuestion(any(), anyString(), any(), any()))
                .thenReturn(Map.of("reply", "ok"));

        service.explainWithAi(1L, 8L, new QuizAiExplainRequest("错误", null));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> qCaptor = ArgumentCaptor.forClass(Map.class);
        verify(aiClientService).explainQuestion(qCaptor.capture(), anyString(), any(), any());
        assertThat(qCaptor.getValue()).doesNotContainKey("options");
        assertThat(qCaptor.getValue()).doesNotContainKey("stored_explanation");
    }

    @Test
    void should_pass_knowledge_node_when_question_links_one() {
        when(userRepository.existsById(1L)).thenReturn(true);
        KnowledgeNode node = KnowledgeNode.builder()
                .id(10L)
                .title("栈")
                .content("LIFO 数据结构")
                .build();
        QuizQuestion q = QuizQuestion.builder()
                .id(9L)
                .content("题")
                .answer("B")
                .questionType("CHOICE")
                .node(node)
                .build();
        when(questionRepository.findById(9L)).thenReturn(Optional.of(q));
        when(aiClientService.explainQuestion(any(), anyString(), any(), any()))
                .thenReturn(Map.of("reply", "ok"));

        service.explainWithAi(1L, 9L, new QuizAiExplainRequest("A", null));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> nodeCaptor = ArgumentCaptor.forClass(Map.class);
        verify(aiClientService).explainQuestion(any(), anyString(), nodeCaptor.capture(), any());
        Map<String, Object> nodeCtx = nodeCaptor.getValue();
        assertThat(nodeCtx).isNotNull();
        assertThat(nodeCtx).containsEntry("title", "栈");
        assertThat(nodeCtx).containsEntry("content", "LIFO 数据结构");
    }

    @Test
    void should_map_history_to_role_content_pairs() {
        when(userRepository.existsById(1L)).thenReturn(true);
        QuizQuestion q = QuizQuestion.builder()
                .id(11L).content("题").answer("B").questionType("CHOICE").build();
        when(questionRepository.findById(11L)).thenReturn(Optional.of(q));
        when(aiClientService.explainQuestion(any(), anyString(), any(), any()))
                .thenReturn(Map.of("reply", "ok"));

        QuizAiExplainRequest req = new QuizAiExplainRequest("A", List.of(
                new ChatMessageDTO("user", "为什么不能选 B?"),
                new ChatMessageDTO("assistant", "因为..."),
                new ChatMessageDTO("user", "再深入一点")
        ));

        service.explainWithAi(1L, 11L, req);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Map<String, String>>> historyCaptor =
                ArgumentCaptor.forClass(List.class);
        verify(aiClientService).explainQuestion(any(), anyString(), any(), historyCaptor.capture());

        List<Map<String, String>> sent = historyCaptor.getValue();
        assertThat(sent).hasSize(3);
        assertThat(sent.get(0)).containsEntry("role", "user");
        assertThat(sent.get(0)).containsEntry("content", "为什么不能选 B?");
        assertThat(sent.get(2)).containsEntry("content", "再深入一点");
    }

    @Test
    void should_pass_null_history_when_request_omits_it() {
        when(userRepository.existsById(1L)).thenReturn(true);
        QuizQuestion q = QuizQuestion.builder()
                .id(12L).content("题").answer("B").questionType("CHOICE").build();
        when(questionRepository.findById(12L)).thenReturn(Optional.of(q));
        when(aiClientService.explainQuestion(any(), anyString(), any(), any()))
                .thenReturn(Map.of("reply", "ok"));

        service.explainWithAi(1L, 12L, new QuizAiExplainRequest("A", null));

        verify(aiClientService).explainQuestion(any(), anyString(), any(), eq(null));
    }

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
