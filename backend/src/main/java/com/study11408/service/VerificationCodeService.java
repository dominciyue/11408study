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
    private static final Duration TTL = Duration.ofMinutes(5);
    private static final SecureRandom RNG = new SecureRandom();

    private final StringRedisTemplate redis;

    public String generateAndStore(String email) {
        String code = String.format("%06d", RNG.nextInt(1_000_000));
        redis.opsForValue().set(KEY_PREFIX + email, code, TTL);
        return code;
    }

    public boolean verifyAndConsume(String email, String code) {
        String key = KEY_PREFIX + email;
        String stored = redis.opsForValue().get(key);
        if (stored == null || !stored.equals(code)) {
            return false;
        }
        redis.delete(key);
        return true;
    }
}
