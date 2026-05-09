package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.entity.Note;
import com.study11408.entity.User;
import com.study11408.repository.NoteRepository;
import com.study11408.testsupport.AbstractIntegrationTest;
import com.study11408.testsupport.TestAuthHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class NoteControllerIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired TestAuthHelper auth;
    @Autowired NoteRepository noteRepository;

    @Test
    void notes_crud_requiresOwnership() throws Exception {
        User alice = auth.ensureUser("alice");
        User bob = auth.ensureUser("bob");

        // Alice creates
        String createBody = objectMapper.writeValueAsString(Map.of(
                "title", "t1",
                "content", "c1"
        ));
        mockMvc.perform(post("/api/notes")
                        .header("Authorization", auth.bearerFor(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("t1"))
                .andReturn();

        // Extract id via repository (simpler, deterministic)
        Note note = noteRepository.findByUserId(alice.getId()).get(0);

        // Bob cannot update
        String updateBody = objectMapper.writeValueAsString(Map.of(
                "title", "t2",
                "content", "c2"
        ));
        mockMvc.perform(put("/api/notes/" + note.getId())
                        .header("Authorization", auth.bearerFor(bob))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden());

        // Bob cannot delete
        mockMvc.perform(delete("/api/notes/" + note.getId())
                        .header("Authorization", auth.bearerFor(bob)))
                .andExpect(status().isForbidden());
    }
}

