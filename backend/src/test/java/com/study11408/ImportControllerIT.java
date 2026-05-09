package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.entity.Material;
import com.study11408.repository.MaterialRepository;
import com.study11408.service.AiClientService;
import com.study11408.testsupport.AbstractIntegrationTest;
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

    @MockBean AiClientService aiClientService;

    @Test
    void parsePdf_returnsChunks() throws Exception {
        Material material = materialRepository.save(Material.builder()
                .title("test.pdf")
                .type("application/pdf")
                .fileUrl("http://example.com/test.pdf")
                .originalName("test.pdf")
                .fileSize(123L)
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

        mockMvc.perform(post("/api/import/materials/" + material.getId() + "/parse-pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalPages").value(1))
                .andExpect(jsonPath("$.data.chunks[0].content").value("hello"))
                .andExpect(jsonPath("$.data.chunks[0].pageNumber").value(1));
    }

    @Test
    void extract_returnsKnowledgePoints() throws Exception {
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.knowledgePoints[0].title").value("KP1"));
    }
}

