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

    @org.junit.jupiter.api.Nested
    class StateMachine {
        // 用真实的 in-memory Map 替代 mock, 验证 bump/count/recordSuccess 之间
        // 的 key 命名约定真的一致, 防止"5 次失败后竟然没锁"这种最致命的偏差。
        private final java.util.Map<String, Long> store = new java.util.HashMap<>();
        private LoginAttemptService svc2;

        @BeforeEach
        void setupMapBackedSvc() {
            StringRedisTemplate fakeRedis = org.mockito.Mockito.mock(StringRedisTemplate.class);
            ValueOperations<String, String> fakeOps = org.mockito.Mockito.mock(ValueOperations.class);
            org.mockito.Mockito.when(fakeRedis.opsForValue()).thenReturn(fakeOps);
            org.mockito.Mockito.when(fakeOps.get(org.mockito.ArgumentMatchers.anyString()))
                    .thenAnswer(inv -> {
                        Long v = store.get(inv.<String>getArgument(0));
                        return v == null ? null : String.valueOf(v);
                    });
            org.mockito.Mockito.when(fakeOps.increment(org.mockito.ArgumentMatchers.anyString()))
                    .thenAnswer(inv -> {
                        String k = inv.getArgument(0);
                        long n = store.getOrDefault(k, 0L) + 1;
                        store.put(k, n);
                        return n;
                    });
            org.mockito.Mockito.when(fakeRedis.delete(org.mockito.ArgumentMatchers.anyString()))
                    .thenAnswer(inv -> {
                        String k = inv.getArgument(0);
                        return store.remove(k) != null;
                    });
            svc2 = new LoginAttemptService(fakeRedis);
            ReflectionTestUtils.setField(svc2, "maxAttempts", 5);
            ReflectionTestUtils.setField(svc2, "lockMinutes", 15);
        }

        @Test
        void five_failures_then_locked_then_success_clears() {
            for (int i = 0; i < 5; i++) {
                svc2.recordFailure("alice", "1.2.3.4");
            }
            assertThat(svc2.isLocked("alice", "1.2.3.4")).isTrue();
            svc2.recordSuccess("alice", "1.2.3.4");
            assertThat(svc2.isLocked("alice", "1.2.3.4")).isFalse();
        }
    }
}
