package com.study11408.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TurnstileService {

    private final RestClient restClient;

    @Value("${app.turnstile.secret-key:}")
    private String secretKey;

    @Value("${app.turnstile.enabled:false}")
    private boolean enabled;

    @Value("${app.turnstile.verify-url:https://challenges.cloudflare.com/turnstile/v0/siteverify}")
    private String verifyUrl;

    public boolean verify(String token, String remoteIp) {
        if (!enabled) return true;
        if (token == null || token.isBlank()) return false;
        if (secretKey == null || secretKey.isBlank()) {
            log.error("Turnstile enabled but secret-key missing — refusing all traffic");
            return false;
        }
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("secret", secretKey);
            form.add("response", token);
            if (remoteIp != null && !remoteIp.isBlank()) form.add("remoteip", remoteIp);
            Map<?, ?> resp = restClient.post()
                    .uri(verifyUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);
            boolean ok = resp != null && Boolean.TRUE.equals(resp.get("success"));
            if (!ok) log.warn("Turnstile verify failed: {}", resp);
            return ok;
        } catch (Exception e) {
            log.error("Turnstile verify call failed", e);
            return false;
        }
    }
}
