package com.study11408.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> ops;
    @InjectMocks LoginAttemptService svc;

    @BeforeEach
    void init() {
        ReflectionTestUtils.setField(svc, "maxAttempts", 5);
        ReflectionTestUtils.setField(svc, "lockMinutes", 15);
        lenient().when(redis.opsForValue()).thenReturn(ops);
    }

    @Test
    void locked_when_ip_counter_exceeds_max() {
        when(ops.get("login:fail:ip:1.2.3.4")).thenReturn("6");
        when(ops.get("login:fail:user:alice")).thenReturn("0");
        assertThat(svc.isLocked("alice", "1.2.3.4")).isTrue();
    }

    @Test
    void locked_when_user_counter_exceeds_max() {
        lenient().when(ops.get("login:fail:ip:1.2.3.4")).thenReturn("0");
        when(ops.get("login:fail:user:alice")).thenReturn("5");
        assertThat(svc.isLocked("alice", "1.2.3.4")).isTrue();
    }

    @Test
    void not_locked_when_both_under_max() {
        when(ops.get(anyString())).thenReturn("2");
        assertThat(svc.isLocked("alice", "1.2.3.4")).isFalse();
    }

    @Test
    void not_locked_when_counters_absent() {
        when(ops.get(anyString())).thenReturn(null);
        assertThat(svc.isLocked("alice", "1.2.3.4")).isFalse();
    }

    @Test
    void recordFailure_increments_both_and_sets_ttl_on_first() {
        when(ops.increment(anyString())).thenReturn(1L);
        svc.recordFailure("alice", "1.2.3.4");
        verify(redis).expire("login:fail:ip:1.2.3.4", Duration.ofMinutes(15));
        verify(redis).expire("login:fail:user:alice", Duration.ofMinutes(15));
    }

    @Test
    void recordFailure_does_not_reset_ttl_after_first() {
        when(ops.increment(anyString())).thenReturn(2L);
        svc.recordFailure("alice", "1.2.3.4");
        verify(redis, never()).expire(anyString(), any(Duration.class));
    }

    @Test
    void recordSuccess_clears_both() {
        svc.recordSuccess("alice", "1.2.3.4");
        verify(redis).delete("login:fail:ip:1.2.3.4");
        verify(redis).delete("login:fail:user:alice");
    }
}
