package com.study11408;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.Topic;
import com.study11408.entity.User;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.TopicRepository;
import com.study11408.testsupport.AbstractIntegrationTest;
import com.study11408.testsupport.TestAuthHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class QuizControllerIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired TestAuthHelper auth;
    @Autowired KnowledgeNodeRepository nodeRepository;
    @Autowired QuizQuestionRepository questionRepository;
    @Autowired TopicRepository topicRepository;

    @Test
    void submit_wrongAnswer_createsWrongAnswerAndReturnsInList() throws Exception {
        User user = auth.ensureUser("quiz_user");

        Topic topic = topicRepository.findAll().stream().findFirst().orElseThrow();
        KnowledgeNode node = nodeRepository.save(KnowledgeNode.builder()
                .title("temp node")
                .content("temp")
                .difficulty("EASY")
                .topic(topic)
                .metadata("{}")
                .build());
        QuizQuestion q = questionRepository.save(QuizQuestion.builder()
                .node(node)
                .questionType("CHOICE")
                .content("2+2=?")
                .options("[\"A. 3\",\"B. 4\",\"C. 5\",\"D. 6\"]")
                .answer("B")
                .explanation("2+2=4")
                .source("test")
                .build());

        String submitBody = objectMapper.writeValueAsString(Map.of(
                "questionId", q.getId(),
                "userAnswer", "A"
        ));

        mockMvc.perform(post("/quiz/submit")
                        .header("Authorization", auth.bearerFor(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.correct").value(false));

        mockMvc.perform(get("/quiz/wrong-answers")
                        .header("Authorization", auth.bearerFor(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].questionId").value(q.getId()))
                .andExpect(jsonPath("$.data[0].userAnswer").value("A"))
                .andExpect(jsonPath("$.data[0].correctAnswer").value("B"));
    }
}

