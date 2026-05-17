package com.study11408.service;

import com.study11408.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 简易内存级 token bucket — 每用户每分钟 N 次 LLM 调用上限。
 *
 * <p>之前所有 AI 端点（/quiz/.../ai-explain、/quiz/nodes/{id}/generate-questions、
 * /knowledge/nodes/{id}/ai-enhance、/study/ai-plan、/import/materials/.../parse-pdf、
 * /import/extract）任意登录用户都能不限频率调用 DeepSeek，单次 5-30s × ~$0.001
 * 起步，恶意脚本能在几分钟内烧穿账单。
 *
 * <p>用 ConcurrentHashMap 是因为部署是单实例（Docker single container），不需要
 * Redis 分布式同步；多实例部署时换 Redis INCR + EXPIRE。
 *
 * <p>用法：controller / service 在调 AiClientService 之前 invoke
 * {@code aiRateLimiter.check(userId)}；超限直接抛 429。
 */
@Service
public class AiRateLimiter {

    private final int maxPerMinute;
    private final Map<Long, Bucket> buckets = new ConcurrentHashMap<>();

    public AiRateLimiter(@Value("${app.ai.rate-limit-per-minute:30}") int maxPerMinute) {
        this.maxPerMinute = maxPerMinute;
    }

    public void check(Long userId) {
        if (userId == null) return;  // 未登录场景由 SecurityFilter 拦，这里不重复抛
        Bucket b = buckets.computeIfAbsent(userId, k -> new Bucket());
        synchronized (b) {
            long now = System.currentTimeMillis();
            if (now - b.windowStart > 60_000L) {
                b.windowStart = now;
                b.count = 0;
            }
            if (b.count >= maxPerMinute) {
                throw new BusinessException(
                        "AI 调用过于频繁，每分钟最多 " + maxPerMinute + " 次，请稍后再试",
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            b.count++;
        }
    }

    private static class Bucket {
        long windowStart = 0L;
        int count = 0;
    }
}
