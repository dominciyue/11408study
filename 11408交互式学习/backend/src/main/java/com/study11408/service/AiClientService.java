package com.study11408.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AiClientService {

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public AiClientService(@Value("${app.ai.service-url}") String aiServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.aiServiceUrl = aiServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> extractKnowledge(String content) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("content", content);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/extract-knowledge", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI知识提取服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> suggestRelations(Long nodeId) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    aiServiceUrl + "/suggest-relations?nodeId=" + nodeId, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI关系推荐服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateQuiz(Long nodeId, String questionType, int count) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("nodeId", nodeId);
            request.put("questionType", questionType);
            request.put("count", count);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/generate-quiz", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI出题服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> enhanceContent(String content) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("content", content);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/enhance-content", request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("AI内容增强服务调用失败", e);
            return Map.of("error", "AI服务暂不可用");
        }
    }
}
