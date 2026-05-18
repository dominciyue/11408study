package com.study11408.service;

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

    @Test
    void generate_persists_six_digit_code_with_5min_ttl() {
        when(redis.opsForValue()).thenReturn(ops);
        String code = svc.generateAndStore("a@b.com");
        assertThat(code).matches("\\d{6}");
        verify(ops).set(eq("email:code:a@b.com"), eq(code), eq(Duration.ofMinutes(5)));
    }

    @Test
    void verify_consumes_code_on_match() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("email:code:a@b.com")).thenReturn("123456");
        when(redis.delete("email:code:a@b.com")).thenReturn(true);
        assertThat(svc.verifyAndConsume("a@b.com", "123456")).isTrue();
        verify(redis).delete("email:code:a@b.com");
    }

    @Test
    void verify_returns_false_when_mismatch_and_keeps_code() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("email:code:a@b.com")).thenReturn("123456");
        assertThat(svc.verifyAndConsume("a@b.com", "000000")).isFalse();
        verify(redis, never()).delete(anyString());
    }
}
