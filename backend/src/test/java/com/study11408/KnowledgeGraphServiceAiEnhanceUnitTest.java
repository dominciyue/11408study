package com.study11408;

import com.study11408.entity.KnowledgeNode;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeEdgeRepository;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.TopicRepository;
import com.study11408.service.AiClientService;
import com.study11408.service.KnowledgeGraphService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test for {@link KnowledgeGraphService#aiEnhanceNode} —
 * AI 节点深入解读入口。
 *
 * <p>断言要点：
 * <ul>
 *   <li>type 不在 EXPLAIN/MNEMONIC/ANALOGY 范围抛 BAD_REQUEST，不打 AI</li>
 *   <li>node 不存在抛 NOT_FOUND，不打 AI</li>
 *   <li>type 大小写不敏感，传 explain 应规整为 EXPLAIN 下发</li>
 *   <li>node.content 为 null 时下发空串而非 null（防 NPE）</li>
 *   <li>缺省 type 应回退 EXPLAIN</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class KnowledgeGraphServiceAiEnhanceUnitTest {

    @Mock private KnowledgeNodeRepository nodeRepository;
    @Mock private KnowledgeEdgeRepository edgeRepository;
    @Mock private TopicRepository topicRepository;
    @Mock private AiClientService aiClientService;
    @Mock private com.study11408.repository.StudyProgressRepository progressRepository;

    private KnowledgeGraphService service;

    @BeforeEach
    void setup() {
        service = new KnowledgeGraphService(
                nodeRepository, edgeRepository, topicRepository, aiClientService, progressRepository);
    }

    @Test
    void should_throw_bad_request_when_type_invalid() {
        assertThatThrownBy(() -> service.aiEnhanceNode(1L, "FOO"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("code", HttpStatus.BAD_REQUEST.value());
        verify(aiClientService, never()).enhanceContent(any(), any(), any());
        verify(nodeRepository, never()).findById(any());
    }

    @Test
    void should_throw_not_found_when_node_missing() {
        when(nodeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.aiEnhanceNode(99L, "EXPLAIN"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("code", HttpStatus.NOT_FOUND.value());
        verify(aiClientService, never()).enhanceContent(any(), any(), any());
    }

    @Test
    void should_normalize_lowercase_type_to_uppercase() {
        KnowledgeNode node = KnowledgeNode.builder()
                .id(1L).title("栈").content("LIFO").build();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        when(aiClientService.enhanceContent(any(), any(), any()))
                .thenReturn(Map.of("enhanced_content", "AI 详解..."));

        Map<String, Object> result = service.aiEnhanceNode(1L, "explain");

        assertThat(result).containsEntry("enhanced_content", "AI 详解...");
        verify(aiClientService).enhanceContent(eq("栈"), eq("LIFO"), eq("EXPLAIN"));
    }

    @Test
    void should_default_to_explain_when_type_null() {
        KnowledgeNode node = KnowledgeNode.builder()
                .id(2L).title("队列").content("FIFO").build();
        when(nodeRepository.findById(2L)).thenReturn(Optional.of(node));
        when(aiClientService.enhanceContent(any(), any(), any()))
                .thenReturn(Map.of("enhanced_content", "ok"));

        service.aiEnhanceNode(2L, null);

        verify(aiClientService).enhanceContent(eq("队列"), eq("FIFO"), eq("EXPLAIN"));
    }

    @Test
    void should_pass_empty_content_when_node_content_null() {
        KnowledgeNode node = KnowledgeNode.builder()
                .id(3L).title("空节点").content(null).build();
        when(nodeRepository.findById(3L)).thenReturn(Optional.of(node));
        when(aiClientService.enhanceContent(any(), any(), any()))
                .thenReturn(Map.of("enhanced_content", "ok"));

        service.aiEnhanceNode(3L, "MNEMONIC");

        verify(aiClientService).enhanceContent(eq("空节点"), eq(""), eq("MNEMONIC"));
    }

    @Test
    void should_accept_all_three_enhance_types() {
        KnowledgeNode node = KnowledgeNode.builder()
                .id(4L).title("t").content("c").build();
        when(nodeRepository.findById(4L)).thenReturn(Optional.of(node));
        when(aiClientService.enhanceContent(any(), any(), any()))
                .thenReturn(Map.of("enhanced_content", "ok"));

        service.aiEnhanceNode(4L, "EXPLAIN");
        service.aiEnhanceNode(4L, "MNEMONIC");
        service.aiEnhanceNode(4L, "ANALOGY");

        verify(aiClientService, org.mockito.Mockito.times(3))
                .enhanceContent(any(), any(), any());
    }
}
