package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.entity.Material;
import com.study11408.entity.User;
import com.study11408.repository.MaterialRepository;
import com.study11408.service.AiClientService;
import com.study11408.testsupport.AbstractIntegrationTest;
import com.study11408.testsupport.TestAuthHelper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class ImportControllerIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired MaterialRepository materialRepository;
    @Autowired TestAuthHelper auth;

    @MockBean AiClientService aiClientService;

    @Test
    void parsePdf_returnsChunks() throws Exception {
        User uploader = auth.ensureUser("import_owner");
        Material material = materialRepository.save(Material.builder()
                .title("test.pdf")
                .type("application/pdf")
                .fileUrl("http://example.com/test.pdf")
                .originalName("test.pdf")
                .fileSize(123L)
                .uploader(uploader)
                .build());

        Mockito.when(aiClientService.parsePdf(Mockito.anyString())).thenReturn(Map.of(
                "title", "Test",
                "total_pages", 1,
                "chunks", List.of(Map.of(
                        "content", "hello",
                        "page_number", 1,
                        "section_title", "S1"
                ))
        ));

        mockMvc.perform(post("/api/import/materials/" + material.getId() + "/parse-pdf")
                        .header("Authorization", auth.bearerFor(uploader)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalPages").value(1))
                .andExpect(jsonPath("$.data.chunks[0].content").value("hello"))
                .andExpect(jsonPath("$.data.chunks[0].pageNumber").value(1));
    }

    @Test
    void parsePdf_rejectsOtherUserAccess() throws Exception {
        User uploader = auth.ensureUser("import_uploader");
        User intruder = auth.ensureUser("import_intruder");
        Material material = materialRepository.save(Material.builder()
                .title("private.pdf")
                .type("application/pdf")
                .fileUrl("http://example.com/private.pdf")
                .originalName("private.pdf")
                .fileSize(123L)
                .uploader(uploader)
                .build());

        mockMvc.perform(post("/api/import/materials/" + material.getId() + "/parse-pdf")
                        .header("Authorization", auth.bearerFor(intruder)))
                .andExpect(status().isForbidden());
    }

    @Test
    void parsePdf_rejectsAnonymous() throws Exception {
        // Spring Security 已配 anyRequest().authenticated()，无 token 应被拒
        mockMvc.perform(post("/api/import/materials/1/parse-pdf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void extract_returnsKnowledgePoints() throws Exception {
        User user = auth.ensureUser("import_extractor");

        Mockito.when(aiClientService.extractKnowledge(Mockito.anyString(), Mockito.any(), Mockito.any()))
                .thenReturn(Map.of(
                        "raw_text", "raw",
                        "knowledge_points", List.of(
                                Map.of("title", "KP1", "content", "C1", "difficulty", "EASY")
                        )
                ));

        String body = objectMapper.writeValueAsString(Map.of(
                "text", "some text",
                "subject", "408",
                "topic", "数据结构"
        ));

        mockMvc.perform(post("/api/import/extract")
                        .header("Authorization", auth.bearerFor(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.knowledgePoints[0].title").value("KP1"));
    }

    @Test
    void extract_rejectsAnonymous() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "text", "some text",
                "subject", "408",
                "topic", "数据结构"
        ));

        mockMvc.perform(post("/api/import/extract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }
}
