package com.study11408.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class VerificationCodeService {

    private static final String KEY_PREFIX = "email:code:";
    private static final String ATTEMPT_PREFIX = "email:code:attempt:";
    private static final Duration TTL = Duration.ofMinutes(5);
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RNG = new SecureRandom();

    private final StringRedisTemplate redis;

    public String generateAndStore(String email) {
        String code = String.format("%06d", RNG.nextInt(1_000_000));
        redis.opsForValue().set(KEY_PREFIX + email, code, TTL);
        // 重发码时重置尝试计数,避免上一次的失败累计影响本次
        redis.delete(ATTEMPT_PREFIX + email);
        return code;
    }

    public boolean verifyAndConsume(String email, String code) {
        String codeKey = KEY_PREFIX + email;
        String attemptKey = ATTEMPT_PREFIX + email;
        // 先 INCR 尝试计数,首次 INCR 后对齐验证码 TTL
        Long attempts = redis.opsForValue().increment(attemptKey);
        if (attempts != null && attempts == 1L) {
            redis.expire(attemptKey, TTL);
        }
        // 超过尝试上限:作废验证码 + 计数,强制重发
        if (attempts != null && attempts > MAX_ATTEMPTS) {
            redis.delete(codeKey);
            redis.delete(attemptKey);
            return false;
        }
        String stored = redis.opsForValue().get(codeKey);
        // 验证码不存在(过期/未发)或不匹配:返 false 但不消费,让用户重试
        if (stored == null || !stored.equals(code)) {
            return false;
        }
        // 匹配成功:消费验证码 + 清计数
        redis.delete(codeKey);
        redis.delete(attemptKey);
        return true;
    }
}
