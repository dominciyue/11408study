package com.study11408.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private static final String IP_PREFIX = "login:fail:ip:";
    private static final String USER_PREFIX = "login:fail:user:";

    private final StringRedisTemplate redis;

    @Value("${app.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.login.lock-minutes:15}")
    private int lockMinutes;

    public boolean isLocked(String username, String ip) {
        return count(USER_PREFIX + username) >= maxAttempts
                || count(IP_PREFIX + ip) >= maxAttempts;
    }

    public void recordFailure(String username, String ip) {
        bump(USER_PREFIX + username);
        bump(IP_PREFIX + ip);
    }

    public void recordSuccess(String username, String ip) {
        redis.delete(USER_PREFIX + username);
        redis.delete(IP_PREFIX + ip);
    }

    private long count(String key) {
        String v = redis.opsForValue().get(key);
        return v == null ? 0 : Long.parseLong(v);
    }

    private void bump(String key) {
        Long n = redis.opsForValue().increment(key);
        if (n != null && n == 1L) {
            redis.expire(key, Duration.ofMinutes(lockMinutes));
        }
    }
}
