package com.study11408;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.security.JwtTokenProvider;
import com.study11408.testsupport.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies P0-01 fix: every issued JWT must contain a "userId" claim so
 * downstream controllers (NoteController, MaterialController, ...) can
 * resolve the authenticated user via {@link JwtTokenProvider#getUserId(String)}.
 */
@AutoConfigureMockMvc
class AuthIntegrationIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtTokenProvider jwtTokenProvider;

    @Test
    void register_should_return_token_with_userId_claim() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "username", "jwtreg",
                "email", "jwtreg@test.local",
                "password", "password123"
        ));

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.user.id").exists())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = root.path("data").path("token").asText();
        long expectedUserId = root.path("data").path("user").path("id").asLong();

        Long claimUserId = jwtTokenProvider.getUserId(token);
        assertThat(claimUserId)
                .as("token must include userId claim (P0-01 regression guard)")
                .isNotNull()
                .isEqualTo(expectedUserId);
    }

    @Test
    void login_should_return_token_with_userId_claim() throws Exception {
        // First register a user.
        String regBody = objectMapper.writeValueAsString(Map.of(
                "username", "jwtlog",
                "email", "jwtlog@test.local",
                "password", "password123"
        ));
        MvcResult regResult = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isOk())
                .andReturn();
        long expectedUserId = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .path("data").path("user").path("id").asLong();

        // Then login.
        String loginBody = objectMapper.writeValueAsString(Map.of(
                "username", "jwtlog",
                "password", "password123"
        ));
        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        Long claimUserId = jwtTokenProvider.getUserId(token);
        assertThat(claimUserId)
                .as("login token must include userId claim (P0-01 regression guard)")
                .isNotNull()
                .isEqualTo(expectedUserId);
    }
}
