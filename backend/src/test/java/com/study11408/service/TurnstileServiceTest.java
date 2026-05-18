package com.study11408.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class TurnstileServiceTest {

    @Mock RestClient restClient;
    @InjectMocks TurnstileService svc;

    @Test
    void verify_returns_true_when_disabled() {
        ReflectionTestUtils.setField(svc, "enabled", false);
        assertThat(svc.verify("anything", "1.2.3.4")).isTrue();
    }

    @Test
    void verify_returns_false_when_enabled_and_token_blank() {
        ReflectionTestUtils.setField(svc, "enabled", true);
        ReflectionTestUtils.setField(svc, "secretKey", "some-secret");
        assertThat(svc.verify("", "1.2.3.4")).isFalse();
        assertThat(svc.verify(null, "1.2.3.4")).isFalse();
    }

    @Test
    void verify_returns_false_when_enabled_but_secret_missing() {
        ReflectionTestUtils.setField(svc, "enabled", true);
        ReflectionTestUtils.setField(svc, "secretKey", "");
        assertThat(svc.verify("some-token", "1.2.3.4")).isFalse();
    }
}
