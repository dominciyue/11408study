package com.study11408.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationCodeServiceTest {

    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> ops;
    @InjectMocks VerificationCodeService svc;

    @BeforeEach
    void setUp() {
        // lenient 让没用到这些 stub 的测试也不会报 unused-stub 错
        lenient().when(redis.opsForValue()).thenReturn(ops);
        // 默认首次 INCR 返回 1(在 MAX_ATTEMPTS 内),覆盖 verifyAndConsume 的常规路径
        lenient().when(ops.increment(anyString())).thenReturn(1L);
    }

    @Test
    void generate_persists_six_digit_code_with_5min_ttl() {
        String code = svc.generateAndStore("a@b.com");
        assertThat(code).matches("\\d{6}");
        verify(ops).set(eq("email:code:a@b.com"), eq(code), eq(Duration.ofMinutes(5)));
        // 重发码时应清理 attempt 计数
        verify(redis).delete("email:code:attempt:a@b.com");
    }

    @Test
    void verify_consumes_code_on_match() {
        when(ops.get("email:code:a@b.com")).thenReturn("123456");
        assertThat(svc.verifyAndConsume("a@b.com", "123456")).isTrue();
        verify(redis).delete("email:code:a@b.com");
        verify(redis).delete("email:code:attempt:a@b.com");
    }

    @Test
    void verify_returns_false_when_mismatch_and_keeps_code() {
        when(ops.get("email:code:a@b.com")).thenReturn("123456");
        assertThat(svc.verifyAndConsume("a@b.com", "000000")).isFalse();
        // 不匹配不应消费验证码 — 用户还能在尝试上限内重试
        verify(redis, never()).delete("email:code:a@b.com");
        verify(redis, never()).delete("email:code:attempt:a@b.com");
    }

    @Test
    void verify_returns_false_when_max_attempts_exceeded() {
        // 第 6 次尝试:超过 MAX_ATTEMPTS=5,应作废验证码 + 计数
        when(ops.increment("email:code:attempt:a@b.com")).thenReturn(6L);
        assertThat(svc.verifyAndConsume("a@b.com", "123456")).isFalse();
        verify(redis).delete("email:code:a@b.com");
        verify(redis).delete("email:code:attempt:a@b.com");
        // 已经决策返 false,不应再去读 stored code
        verify(ops, never()).get(anyString());
    }

    @Test
    void verify_returns_false_when_code_missing_in_redis() {
        // 验证码 key 已过期或从未生成 — 必须返 false 但不消费(避免删非自己产生的 key)
        when(ops.get("email:code:a@b.com")).thenReturn(null);
        assertThat(svc.verifyAndConsume("a@b.com", "123456")).isFalse();
        verify(redis, never()).delete("email:code:a@b.com");
        verify(redis, never()).delete("email:code:attempt:a@b.com");
    }
}
