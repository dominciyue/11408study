package com.study11408.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AiClientService {

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public AiClientService(
            @Value("${app.ai.service-url}") String aiServiceUrl,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.ai.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${app.ai.read-timeout-ms:120000}") int readTimeoutMs) {
        this.aiServiceUrl = aiServiceUrl;
        // P0-06: configure timeouts so a hung AI service cannot exhaust the
        // backend worker thread pool. connect=5s (TCP setup should be fast),
        // read=120s (LLM calls may take 30-90s; aligned with nginx /ai/
        // proxy_read_timeout 120s).
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> extractKnowledge(String text, String subject, String topic) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("text", text);
            request.put("subject", subject);
            request.put("topic", topic);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/extract", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI知识提取服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> suggestRelations(Long nodeId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("node_id", nodeId);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/suggest-relations", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI关系推荐服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateQuiz(
            String knowledgeTitle,
            String knowledgeContent,
            String questionType,
            int count,
            String difficulty) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("knowledge_title", knowledgeTitle);
            request.put("knowledge_content", knowledgeContent);
            request.put("question_type", questionType);
            request.put("count", count);
            if (difficulty != null && !difficulty.isBlank()) {
                request.put("difficulty", difficulty);
            }

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/generate-quiz", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI出题服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> enhanceContent(String title, String content, String enhanceType) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("title", title);
            request.put("content", content);
            request.put("enhance_type", enhanceType);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/enhance", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI内容增强服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> explainQuestion(
            Map<String, Object> question,
            String userAnswer,
            Map<String, Object> knowledgeNode,
            List<Map<String, String>> history) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("question", question);
            request.put("user_answer", userAnswer);
            if (knowledgeNode != null) {
                request.put("knowledge_node", knowledgeNode);
            }
            if (history != null && !history.isEmpty()) {
                request.put("history", history);
            }

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/explain-question", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI讲题服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    /**
     * 调用 ai-service `/ai/study-plan` 生成分周学习计划。
     *
     * @param goal 用户目标（必填）
     * @param weeks 计划跨度（已由 controller 层 @Valid 校验在 [1,52]）
     * @param subjectName 主攻学科名（可空）
     * @param weakTopics 薄弱主题列表（可空）
     * @param studiedNodes 已学知识点数（可空）
     * @param totalNodes 知识点总数（可空）
     * @return ai-service 原始响应（plan + summary），或 {error: ...} 表示降级
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> generateStudyPlan(
            String goal,
            int weeks,
            String subjectName,
            List<String> weakTopics,
            Long studiedNodes,
            Long totalNodes) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("goal", goal);
            request.put("weeks", weeks);
            if (subjectName != null && !subjectName.isBlank()) {
                request.put("subject_name", subjectName);
            }
            if (weakTopics != null && !weakTopics.isEmpty()) {
                request.put("weak_topics", weakTopics);
            }
            if (studiedNodes != null) {
                request.put("studied_nodes", studiedNodes);
            }
            if (totalNodes != null) {
                request.put("total_nodes", totalNodes);
            }

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/study-plan", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI 学习计划生成服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    /**
     * 调用 ai-service `/ai/classify-wrong-answer` 给一条错题打 5 类病因之一。
     * <p>AI 失败时返回 {error: ...},调用方应保持 errorCategory 为 null 待重试。
     *
     * @param questionText 题目正文(必填)
     * @param options      选项列表(可空)
     * @param correctAnswer 正确答案(必填)
     * @param userAnswer   学生答案(必填)
     * @param explanation  题目自带解析(可空)
     * @return {category: <enum>, reason: <reason>} 或 {error: ...}
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> classifyWrongAnswer(
            String questionText,
            List<String> options,
            String correctAnswer,
            String userAnswer,
            String explanation) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("question_text", questionText);
            if (options != null && !options.isEmpty()) {
                request.put("options", options);
            }
            request.put("correct_answer", correctAnswer == null ? "" : correctAnswer);
            request.put("user_answer", userAnswer == null ? "" : userAnswer);
            if (explanation != null && !explanation.isBlank()) {
                request.put("explanation", explanation);
            }
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/classify-wrong-answer", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.warn("AI 错题归类服务调用失败: {}", e.getMessage());
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parsePdf(String fileUrl) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("file_url", fileUrl);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/parse-pdf", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI PDF解析服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }
}
