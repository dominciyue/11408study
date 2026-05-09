package com.study11408;

import com.study11408.controller.ImportController;
import com.study11408.dto.ApiResponse;
import com.study11408.dto.ImportKnowledgeExtractRequest;
import com.study11408.dto.ImportKnowledgeExtractResponse;
import com.study11408.dto.ImportPdfParseResponse;
import com.study11408.entity.Material;
import com.study11408.exception.BusinessException;
import com.study11408.repository.MaterialRepository;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.AiClientService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * P0-03 回归测试：验证 ImportController 鉴权 + 资料归属校验。
 */
@ExtendWith(MockitoExtension.class)
class ImportControllerUnitTest {

    @Mock private MaterialRepository materialRepository;
    @Mock private AiClientService aiClientService;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private HttpServletRequest request;

    @InjectMocks private ImportController controller;

    @Test
    void parsePdf_should_reject_when_no_token() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn(null);

        assertThatThrownBy(() -> controller.parsePdf(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    void parsePdf_should_reject_when_token_has_no_userId_claim() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn("legacytoken");
        when(jwtTokenProvider.getUserId("legacytoken")).thenReturn(null);

        assertThatThrownBy(() -> controller.parsePdf(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    void parsePdf_should_reject_when_material_belongs_to_other_user() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(99L);

        Material m = new Material();
        m.setId(1L);
        m.setUploaderId(42L); // 不是 99
        m.setFileUrl("s3://path");
        when(materialRepository.findById(1L)).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> controller.parsePdf(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("无权")
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    void parsePdf_should_return_404_when_material_not_found() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(42L);
        when(materialRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.parsePdf(999L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("资料不存在")
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(HttpStatus.NOT_FOUND.value());
    }

    @Test
    void parsePdf_should_allow_when_material_belongs_to_user() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(42L);

        Material m = new Material();
        m.setId(1L);
        m.setUploaderId(42L);
        m.setFileUrl("s3://path");
        when(materialRepository.findById(1L)).thenReturn(Optional.of(m));
        when(aiClientService.parsePdf("s3://path")).thenReturn(Map.of(
                "title", "T",
                "total_pages", 1,
                "chunks", List.of()
        ));

        ApiResponse<ImportPdfParseResponse> resp = controller.parsePdf(1L, request);
        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getData()).isNotNull();
        assertThat(resp.getData().getTitle()).isEqualTo("T");
    }

    @Test
    void parsePdf_should_allow_when_material_has_null_uploader() {
        // V1 schema 中 uploader_id 是 nullable；旧资料 uploader 缺失应放行（向后兼容）
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(42L);

        Material m = new Material();
        m.setId(1L);
        m.setUploaderId(null);
        m.setFileUrl("s3://path");
        when(materialRepository.findById(1L)).thenReturn(Optional.of(m));
        when(aiClientService.parsePdf("s3://path")).thenReturn(Map.of(
                "title", "T",
                "total_pages", 1,
                "chunks", List.of()
        ));

        ApiResponse<ImportPdfParseResponse> resp = controller.parsePdf(1L, request);
        assertThat(resp.isSuccess()).isTrue();
    }

    @Test
    void extract_should_reject_when_no_token() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn(null);

        ImportKnowledgeExtractRequest body = new ImportKnowledgeExtractRequest();
        body.setText("text");
        body.setSubject("408");
        body.setTopic("数据结构");

        assertThatThrownBy(() -> controller.extract(body, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    void extract_should_allow_when_logged_in() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(42L);
        lenient().when(aiClientService.extractKnowledge("text", "408", "数据结构")).thenReturn(Map.of(
                "raw_text", "raw",
                "knowledge_points", List.of(Map.of("title", "KP1", "content", "C1", "difficulty", "EASY"))
        ));

        ImportKnowledgeExtractRequest body = new ImportKnowledgeExtractRequest();
        body.setText("text");
        body.setSubject("408");
        body.setTopic("数据结构");

        ApiResponse<ImportKnowledgeExtractResponse> resp = controller.extract(body, request);
        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getData()).isNotNull();
        assertThat(resp.getData().getKnowledgePoints()).hasSize(1);
    }

    // "PDF 出处定位"：ai-service 返回 source_excerpt 时应透传到 DTO
    @Test
    void extract_should_propagate_source_excerpt_when_present() {
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(42L);
        lenient().when(aiClientService.extractKnowledge("text", "408", "数据结构")).thenReturn(Map.of(
                "raw_text", "raw",
                "knowledge_points", List.of(Map.of(
                        "title", "栈",
                        "content", "LIFO 数据结构",
                        "difficulty", "EASY",
                        "source_excerpt", "栈是一种后进先出的线性表。"
                ))
        ));

        ImportKnowledgeExtractRequest body = new ImportKnowledgeExtractRequest();
        body.setText("text");
        body.setSubject("408");
        body.setTopic("数据结构");

        ApiResponse<ImportKnowledgeExtractResponse> resp = controller.extract(body, request);
        assertThat(resp.getData().getKnowledgePoints()).hasSize(1);
        assertThat(resp.getData().getKnowledgePoints().get(0).getSourceExcerpt())
                .isEqualTo("栈是一种后进先出的线性表。");
    }

    @Test
    void extract_should_treat_blank_source_excerpt_as_null() {
        // ai-service 在原文不足时被允许返回空字符串；DTO 层应规整为 null，
        // 避免前端渲染空白"出处"块
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(42L);
        lenient().when(aiClientService.extractKnowledge("text", null, null)).thenReturn(Map.of(
                "raw_text", "raw",
                "knowledge_points", List.of(Map.of(
                        "title", "T",
                        "content", "C",
                        "difficulty", "EASY",
                        "source_excerpt", "   "
                ))
        ));

        ImportKnowledgeExtractRequest body = new ImportKnowledgeExtractRequest();
        body.setText("text");

        ApiResponse<ImportKnowledgeExtractResponse> resp = controller.extract(body, request);
        assertThat(resp.getData().getKnowledgePoints().get(0).getSourceExcerpt()).isNull();
    }

    @Test
    void extract_should_handle_missing_source_excerpt_gracefully() {
        // 老 ai-service 回包不含该字段时不应 NPE
        when(jwtTokenProvider.resolveToken(request)).thenReturn("faketoken");
        when(jwtTokenProvider.getUserId("faketoken")).thenReturn(42L);
        lenient().when(aiClientService.extractKnowledge("text", null, null)).thenReturn(Map.of(
                "raw_text", "raw",
                "knowledge_points", List.of(Map.of(
                        "title", "T",
                        "content", "C",
                        "difficulty", "EASY"
                ))
        ));

        ImportKnowledgeExtractRequest body = new ImportKnowledgeExtractRequest();
        body.setText("text");

        ApiResponse<ImportKnowledgeExtractResponse> resp = controller.extract(body, request);
        assertThat(resp.getData().getKnowledgePoints().get(0).getSourceExcerpt()).isNull();
    }
}
