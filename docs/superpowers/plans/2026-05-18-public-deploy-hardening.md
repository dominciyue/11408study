# 公网上线安全加固 + 部署基建实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 11408study 项目可以安全地以公网 HTTPS 站点形式对外服务,落地三道安全闸(邮箱注册验证 + Cloudflare Turnstile 人机验证 + 登录频率限制),并把硬编码密钥/端口收敛到生产 compose + nginx + env 模板里,最后产出一份从买腾讯云轻量到证书签发的逐步部署文档。

**Architecture:**
- **认证流程**:注册 = Turnstile + 邮箱验证码 + 密码 → 写 `email_verified=true`;登录 = Turnstile + 用户名密码 + Redis 失败次数闸门。验证码 6 位数字,Redis TTL 5 分钟,key `email:code:{email}`;登录失败计数 key `login:fail:{ip}` 和 `login:fail:user:{username}`,15 分钟 5 次封禁。
- **部署形态**:`docker-compose.prod.yml` 作为生产覆盖文件(`-f base -f prod` 合并),所有 secret 走 `.env`;只暴露 nginx 80/443,后端服务用 docker 内网通信。nginx 走 Certbot webroot 模式签证书,启用 HSTS、安全头、强制 HTTPS 跳转。
- **第三方依赖**:QQ 邮箱 SMTP(免费,需开授权码)、Cloudflare Turnstile(免费,需注册站点拿到 sitekey/secret)。

**Tech Stack:**
- Backend: Spring Boot 3.2.5 + spring-boot-starter-mail + Spring Data Redis + 现有 jjwt + Flyway
- Frontend: Next.js 16 + `@marsidev/react-turnstile`
- Infra: Docker Compose 2.x + nginx:alpine + certbot/certbot

---

## File Structure

### Backend — 新建
- `backend/src/main/java/com/study11408/service/VerificationCodeService.java` — Redis 存取 6 位验证码
- `backend/src/main/java/com/study11408/service/EmailService.java` — 包装 JavaMailSender 发验证码邮件
- `backend/src/main/java/com/study11408/service/TurnstileService.java` — 调 Cloudflare siteverify
- `backend/src/main/java/com/study11408/service/LoginAttemptService.java` — Redis 计数 + 锁判定
- `backend/src/main/java/com/study11408/dto/SendEmailCodeRequest.java`
- `backend/src/main/java/com/study11408/config/RestClientConfig.java` — 共享 RestClient bean(Turnstile 调用)
- `backend/src/main/resources/db/migration/V15__user_email_verified.sql`
- `backend/src/test/java/com/study11408/service/VerificationCodeServiceTest.java`
- `backend/src/test/java/com/study11408/service/TurnstileServiceTest.java`
- `backend/src/test/java/com/study11408/service/LoginAttemptServiceTest.java`

### Backend — 改动
- `backend/pom.xml` — 加 `spring-boot-starter-mail`
- `backend/src/main/java/com/study11408/entity/User.java` — 加 `emailVerified` 字段
- `backend/src/main/java/com/study11408/dto/RegisterRequest.java` — 加 `emailCode` + `turnstileToken`
- `backend/src/main/java/com/study11408/dto/LoginRequest.java` — 加 `turnstileToken`
- `backend/src/main/java/com/study11408/service/AuthService.java` — register 校验邮箱码 + Turnstile;login 校验 Turnstile + 频率
- `backend/src/main/java/com/study11408/controller/AuthController.java` — 新增 `POST /auth/send-email-code`
- `backend/src/main/java/com/study11408/config/SecurityConfig.java` — 公开 `/auth/send-email-code`
- `backend/src/main/java/com/study11408/security/JwtTokenProvider.java` — secret 强制非空校验(prod)
- `backend/src/main/resources/application.yml` — 邮件 / Turnstile / 限流默认配置
- `backend/src/main/resources/application-prod.yml` — CORS 白名单只走 env,JWT secret 必须 env 注入
- `backend/src/test/java/com/study11408/AuthIntegrationIT.java` — 调整既有用例适配新字段

### Frontend — 新建
- `frontend/src/components/TurnstileWidget.tsx` — 包装 `@marsidev/react-turnstile`
- `frontend/src/components/EmailCodeInput.tsx` — 验证码输入框 + 发送按钮 + 60s 倒计时

### Frontend — 改动
- `frontend/package.json` — 加 `@marsidev/react-turnstile`
- `frontend/src/types/index.ts` — `LoginRequest`/`RegisterRequest` 加 `turnstileToken`,`RegisterRequest` 加 `emailCode`
- `frontend/src/lib/api.ts` — `authApi` 加 `sendEmailCode`
- `frontend/src/app/(auth)/login/page.tsx` — 集成 Turnstile
- `frontend/src/app/(auth)/register/page.tsx` — 集成 Turnstile + EmailCodeInput
- `frontend/src/stores/auth-store.ts` — `login/register` 透传 turnstileToken/emailCode
- `frontend/.env.example` — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 占位

### Infra — 新建
- `docker-compose.prod.yml` — 生产覆盖:secret 走 env、删 host 端口、`restart: unless-stopped`、加 nginx 443 卷
- `nginx/nginx.prod.conf` — HTTPS server block + HSTS + 安全头 + 屏蔽 swagger/actuator
- `docs/deploy-tencent.md` — 部署手册

### Infra — 改动
- `.env.example` — 全量列出所有生产 env(数据库/Redis/MinIO/JWT/Mail/Turnstile/CORS/Domain)
- `docker-compose.yml` — 仅把硬编码密码改成 `${VAR:-dev_default}` 形式,dev 行为不变

---

## Tasks

### Task 1: 加 spring-boot-starter-mail 依赖

**Files:**
- Modify: `backend/pom.xml`

- [ ] **Step 1: 在 dependencies 块中追加 mail starter**

在 `<artifactId>spring-boot-starter-data-redis</artifactId>` 那段后面紧接添加:

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
```

- [ ] **Step 2: 验证依赖能解析**

Run: `cd backend && mvn -DskipTests -q dependency:resolve | tail`
Expected: 退出码 0,无 ERROR 行。

- [ ] **Step 3: 提交**

```bash
git add backend/pom.xml
git commit -m "build(backend): add spring-boot-starter-mail for email verification"
```

---

### Task 2: Flyway V15 — users 表加 email_verified 字段

**Files:**
- Create: `backend/src/main/resources/db/migration/V15__user_email_verified.sql`
- Modify: `backend/src/main/java/com/study11408/entity/User.java`

- [ ] **Step 1: 写 migration**

```sql
-- 已注册的旧用户视为已验证,避免一刀切让所有人重新走邮箱激活
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

ALTER TABLE users
    ALTER COLUMN email_verified DROP DEFAULT;

ALTER TABLE users
    ALTER COLUMN email_verified SET DEFAULT FALSE;

CREATE INDEX idx_users_email_verified ON users(email_verified);
```

- [ ] **Step 2: User 实体补字段**

在 `User.java` 的 `private String role = "USER";` 后面、`@CreationTimestamp` 之前,加:

```java
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;
```

- [ ] **Step 3: 启动校验 schema 一致**

Run: `cd backend && mvn -DskipTests -q spring-boot:run &` 然后 `curl -s http://localhost:8080/api/actuator/health` 看 200,再 `kill %1`。
Expected: 健康检查 `{"status":"UP"}`,迁移日志含 `Migrating schema "public" to version "15"`。

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/resources/db/migration/V15__user_email_verified.sql backend/src/main/java/com/study11408/entity/User.java
git commit -m "feat(auth): add email_verified column for registration verification"
```

---

### Task 3: VerificationCodeService — Redis 存取 6 位验证码

**Files:**
- Create: `backend/src/main/java/com/study11408/service/VerificationCodeService.java`
- Test: `backend/src/test/java/com/study11408/service/VerificationCodeServiceTest.java`

- [ ] **Step 1: 写失败测试**

```java
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
```

- [ ] **Step 2: 运行测试看失败**

Run: `cd backend && mvn -Dtest=VerificationCodeServiceTest test`
Expected: 编译失败 — `cannot find symbol class VerificationCodeService`。

- [ ] **Step 3: 写实现**

```java
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
```

- [ ] **Step 4: 测试通过**

Run: `cd backend && mvn -Dtest=VerificationCodeServiceTest test`
Expected: `BUILD SUCCESS`, 3 tests passed.

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/com/study11408/service/VerificationCodeService.java backend/src/test/java/com/study11408/service/VerificationCodeServiceTest.java
git commit -m "feat(auth): VerificationCodeService — Redis-backed 6-digit codes with 5min TTL"
```

---

### Task 4: EmailService — QQ SMTP 发验证码邮件

**Files:**
- Create: `backend/src/main/java/com/study11408/service/EmailService.java`
- Modify: `backend/src/main/resources/application.yml`

- [ ] **Step 1: 在 application.yml 顶层 spring 块中加 mail 配置**

在 `cache:` 块之后追加:

```yaml
  mail:
    host: ${MAIL_HOST:smtp.qq.com}
    port: ${MAIL_PORT:465}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail.smtp.auth: true
      mail.smtp.ssl.enable: true
      mail.smtp.starttls.enable: true
      mail.smtp.connectiontimeout: 5000
      mail.smtp.timeout: 5000

app:
  mail:
    from: ${MAIL_FROM:${spring.mail.username}}
    from-name: ${MAIL_FROM_NAME:11408 学习平台}
```

> 注意:`app:` 已存在,把 `mail:` 块加到现有 `app:` 节点下,不要重复声明 `app:` 顶层。手动 merge 时把 `from`/`from-name` 加在 `jwt:` 之后即可。

- [ ] **Step 2: 写实现**

```java
package com.study11408.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.from-name:11408 学习平台}")
    private String fromName;

    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(new InternetAddress(from, fromName, "UTF-8"));
            h.setTo(to);
            h.setSubject("【11408 学习平台】注册验证码");
            h.setText(
                "<p>您的验证码是:<b style=\"font-size:18px\">" + code + "</b></p>" +
                "<p>5 分钟内有效。如非本人操作请忽略。</p>",
                true);
            mailSender.send(msg);
            log.info("verification code sent to {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("failed to send verification code to {}", to, e);
            throw new IllegalStateException("邮件发送失败,请稍后重试", e);
        }
    }
}
```

- [ ] **Step 3: 编译通过**

Run: `cd backend && mvn -DskipTests -q compile`
Expected: 成功,无 `cannot find symbol`。

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/java/com/study11408/service/EmailService.java backend/src/main/resources/application.yml
git commit -m "feat(auth): EmailService — send verification code via SMTP (QQ Mail by default)"
```

---

### Task 5: /auth/send-email-code 端点 + 注册校验邮箱码

**Files:**
- Create: `backend/src/main/java/com/study11408/dto/SendEmailCodeRequest.java`
- Modify: `backend/src/main/java/com/study11408/dto/RegisterRequest.java`
- Modify: `backend/src/main/java/com/study11408/controller/AuthController.java`
- Modify: `backend/src/main/java/com/study11408/service/AuthService.java`
- Modify: `backend/src/main/java/com/study11408/config/SecurityConfig.java`

- [ ] **Step 1: SendEmailCodeRequest DTO**

```java
package com.study11408.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendEmailCodeRequest {
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}
```

- [ ] **Step 2: RegisterRequest 加 emailCode**

在 `private String nickname;` 之前插入:

```java
    @NotBlank(message = "邮箱验证码不能为空")
    @Size(min = 6, max = 6, message = "邮箱验证码必须是6位")
    private String emailCode;
```

(`turnstileToken` 留到 Task 7 一起加,避免反复改 DTO 触发测试。)

- [ ] **Step 3: AuthService 注入新依赖并改 register**

把 `AuthService` 顶部依赖区改成:

```java
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final VerificationCodeService verificationCodeService;
    private final EmailService emailService;
```

`register` 方法首行加邮箱码校验、写库时设 `emailVerified=true`:

```java
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!verificationCodeService.verifyAndConsume(request.getEmail(), request.getEmailCode())) {
            throw new BusinessException("邮箱验证码错误或已过期");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname() != null ? request.getNickname() : request.getUsername())
                .role("USER")
                .emailVerified(true)
                .build();
        user = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());
        return AuthResponse.builder().token(token).refreshToken(refreshToken).user(toUserDTO(user)).build();
    }
```

新增 `sendEmailCode` 方法:

```java
    public void sendEmailCode(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("邮箱已被注册");
        }
        String code = verificationCodeService.generateAndStore(email);
        emailService.sendVerificationCode(email, code);
    }
```

- [ ] **Step 4: AuthController 新增端点**

在 `register` 之前插入:

```java
    @Operation(summary = "发送邮箱注册验证码")
    @PostMapping("/send-email-code")
    public ApiResponse<Void> sendEmailCode(@Valid @RequestBody SendEmailCodeRequest request) {
        authService.sendEmailCode(request.getEmail());
        return ApiResponse.ok(null);
    }
```

- [ ] **Step 5: SecurityConfig 公开新端点**

把 `requestMatchers("/auth/login", "/auth/register", "/auth/refresh").permitAll()` 改为:

```java
                .requestMatchers("/auth/login", "/auth/register", "/auth/refresh", "/auth/send-email-code").permitAll()
```

- [ ] **Step 6: 修补既有 AuthIntegrationIT 测试**

打开 `backend/src/test/java/com/study11408/AuthIntegrationIT.java`,所有 `RegisterRequest` 构造或 setter 链都补上 `emailCode("123456")`。在 setUp 阶段往 Redis 写入对应 `email:code:{email} = 123456`(用 `StringRedisTemplate` 注入)以便 register 通过校验。

> 没有 IT 用 Testcontainers Redis 时,可直接 mock `VerificationCodeService.verifyAndConsume` → true(在 `@MockBean` 注册)。

- [ ] **Step 7: 跑测试**

Run: `cd backend && mvn -Dtest='AuthIntegrationIT' test`
Expected: 全绿。

- [ ] **Step 8: 手动 smoke**

```bash
curl -s -X POST http://localhost:8080/api/auth/send-email-code \
  -H 'Content-Type: application/json' -d '{"email":"test@example.com"}'
```
Expected: `{"success":true,"data":null,...}` 且(若 MAIL_USERNAME 已配置)收到真实邮件。

- [ ] **Step 9: 提交**

```bash
git add backend/src/main/java/com/study11408/dto/SendEmailCodeRequest.java \
        backend/src/main/java/com/study11408/dto/RegisterRequest.java \
        backend/src/main/java/com/study11408/controller/AuthController.java \
        backend/src/main/java/com/study11408/service/AuthService.java \
        backend/src/main/java/com/study11408/config/SecurityConfig.java \
        backend/src/test/java/com/study11408/AuthIntegrationIT.java
git commit -m "feat(auth): require email verification code on register; expose /auth/send-email-code"
```

---

### Task 6: 共享 RestClient bean + TurnstileService

**Files:**
- Create: `backend/src/main/java/com/study11408/config/RestClientConfig.java`
- Create: `backend/src/main/java/com/study11408/service/TurnstileService.java`
- Test: `backend/src/test/java/com/study11408/service/TurnstileServiceTest.java`
- Modify: `backend/src/main/resources/application.yml`

- [ ] **Step 1: application.yml 加 turnstile 配置**

在 `app:` 节点下追加:

```yaml
  turnstile:
    secret-key: ${TURNSTILE_SECRET_KEY:}
    # 设为 false 时跳过 Turnstile 校验(本地 dev 默认关掉,生产必须打开)
    enabled: ${TURNSTILE_ENABLED:false}
    verify-url: https://challenges.cloudflare.com/turnstile/v0/siteverify
```

- [ ] **Step 2: RestClientConfig**

```java
package com.study11408.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
                    setConnectTimeout((int) Duration.ofSeconds(3).toMillis());
                    setReadTimeout((int) Duration.ofSeconds(5).toMillis());
                }})
                .build();
    }
}
```

- [ ] **Step 3: 写失败测试**

```java
package com.study11408.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
        assertThat(svc.verify("", "1.2.3.4")).isFalse();
        assertThat(svc.verify(null, "1.2.3.4")).isFalse();
    }
}
```

- [ ] **Step 4: 实现**

```java
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
```

- [ ] **Step 5: 测试通过**

Run: `cd backend && mvn -Dtest=TurnstileServiceTest test`
Expected: 2 tests passed.

- [ ] **Step 6: 提交**

```bash
git add backend/src/main/java/com/study11408/config/RestClientConfig.java \
        backend/src/main/java/com/study11408/service/TurnstileService.java \
        backend/src/test/java/com/study11408/service/TurnstileServiceTest.java \
        backend/src/main/resources/application.yml
git commit -m "feat(auth): TurnstileService — verify Cloudflare Turnstile tokens with kill-switch"
```

---

### Task 7: 在 register/login DTO 加 turnstileToken,AuthService 强校验

**Files:**
- Modify: `backend/src/main/java/com/study11408/dto/RegisterRequest.java`
- Modify: `backend/src/main/java/com/study11408/dto/LoginRequest.java`
- Modify: `backend/src/main/java/com/study11408/service/AuthService.java`
- Modify: `backend/src/main/java/com/study11408/controller/AuthController.java`

- [ ] **Step 1: 两个 DTO 都加 turnstileToken**

`RegisterRequest.java` 末字段后追加:

```java
    private String turnstileToken;
```

`LoginRequest.java` 同样追加(查看现有文件确保位置)。

> 不加 `@NotBlank`,因为 dev 模式 Turnstile 默认禁用,前端可能不带。是否拒绝由 Service 层根据 `enabled` 决定。

- [ ] **Step 2: AuthService 注入 TurnstileService**

依赖区追加 `private final TurnstileService turnstileService;`,新增私有方法:

```java
    private void requireTurnstile(String token, String remoteIp) {
        if (!turnstileService.verify(token, remoteIp)) {
            throw new BusinessException("人机验证失败,请刷新页面重试");
        }
    }
```

`register` 顶部、`verifyAndConsume` 之前加:

```java
        requireTurnstile(request.getTurnstileToken(), request.getRemoteIp());
```

> `RegisterRequest` 不持 `remoteIp` — 改用 `register(RegisterRequest, String remoteIp)` 签名,把 IP 从 controller 传进来。下一步会调。

把 `register` 签名改为:
```java
    public AuthResponse register(RegisterRequest request, String remoteIp) { ... }
```
内部把 `requireTurnstile` 改成:
```java
        requireTurnstile(request.getTurnstileToken(), remoteIp);
```

`login` 同样改造:签名 `login(LoginRequest request, String remoteIp)`,顶部先 `requireTurnstile(request.getTurnstileToken(), remoteIp)`。

- [ ] **Step 3: AuthController 取 IP 后传入**

在类顶部加私有方法:

```java
    private static String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String real = req.getHeader("X-Real-IP");
        return (real != null && !real.isBlank()) ? real : req.getRemoteAddr();
    }
```

`register` / `login` 签名加 `HttpServletRequest req`,内部调用改为 `authService.register(request, clientIp(req))`。

- [ ] **Step 4: 编译 + 跑 register/login 既有 IT**

Run: `cd backend && mvn -Dtest='*Auth*IT' test`
Expected: 通过。若 IT 失败,在 IT 设置 `app.turnstile.enabled=false`(test profile yml)。

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/com/study11408/dto/RegisterRequest.java \
        backend/src/main/java/com/study11408/dto/LoginRequest.java \
        backend/src/main/java/com/study11408/service/AuthService.java \
        backend/src/main/java/com/study11408/controller/AuthController.java
git commit -m "feat(auth): require Cloudflare Turnstile token on register/login"
```

---

### Task 8: LoginAttemptService — Redis 双维度频率限制

**Files:**
- Create: `backend/src/main/java/com/study11408/service/LoginAttemptService.java`
- Test: `backend/src/test/java/com/study11408/service/LoginAttemptServiceTest.java`
- Modify: `backend/src/main/java/com/study11408/service/AuthService.java`
- Modify: `backend/src/main/resources/application.yml`

- [ ] **Step 1: application.yml 加配置**

在 `app:` 节点追加:

```yaml
  login:
    max-attempts: ${LOGIN_MAX_ATTEMPTS:5}
    lock-minutes: ${LOGIN_LOCK_MINUTES:15}
```

- [ ] **Step 2: 写失败测试**

```java
package com.study11408.service;

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

    @org.junit.jupiter.api.BeforeEach
    void init() {
        ReflectionTestUtils.setField(svc, "maxAttempts", 5);
        ReflectionTestUtils.setField(svc, "lockMinutes", 15);
        when(redis.opsForValue()).thenReturn(ops);
    }

    @Test
    void locked_when_either_counter_exceeds_max() {
        when(ops.get("login:fail:ip:1.2.3.4")).thenReturn("6");
        when(ops.get("login:fail:user:alice")).thenReturn("0");
        assertThat(svc.isLocked("alice", "1.2.3.4")).isTrue();
    }

    @Test
    void not_locked_when_both_under_max() {
        when(ops.get(anyString())).thenReturn("2");
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
    void recordSuccess_clears_both() {
        svc.recordSuccess("alice", "1.2.3.4");
        verify(redis).delete("login:fail:ip:1.2.3.4");
        verify(redis).delete("login:fail:user:alice");
    }
}
```

- [ ] **Step 3: 实现**

```java
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
```

- [ ] **Step 4: 测试通过**

Run: `cd backend && mvn -Dtest=LoginAttemptServiceTest test`
Expected: 4 tests passed.

- [ ] **Step 5: AuthService.login 接入**

`login` 方法改为:

```java
    public AuthResponse login(LoginRequest request, String remoteIp) {
        requireTurnstile(request.getTurnstileToken(), remoteIp);
        if (loginAttemptService.isLocked(request.getUsername(), remoteIp)) {
            throw new BusinessException("登录失败次数过多,请 15 分钟后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));
            loginAttemptService.recordSuccess(request.getUsername(), remoteIp);
            String token = jwtTokenProvider.generateToken(user.getUsername(), user.getId());
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());
            return AuthResponse.builder().token(token).refreshToken(refreshToken).user(toUserDTO(user)).build();
        } catch (org.springframework.security.core.AuthenticationException ex) {
            loginAttemptService.recordFailure(request.getUsername(), remoteIp);
            throw new BusinessException("用户名或密码错误", HttpStatus.UNAUTHORIZED);
        }
    }
```

依赖区追加 `private final LoginAttemptService loginAttemptService;`。

- [ ] **Step 6: 编译 + 跑 IT**

Run: `cd backend && mvn -Dtest='*Auth*IT' test`
Expected: 通过(如果 IT 用错误密码探测,需要 mock LoginAttemptService 或在 setUp 清理 Redis key)。

- [ ] **Step 7: 提交**

```bash
git add backend/src/main/java/com/study11408/service/LoginAttemptService.java \
        backend/src/test/java/com/study11408/service/LoginAttemptServiceTest.java \
        backend/src/main/java/com/study11408/service/AuthService.java \
        backend/src/main/resources/application.yml
git commit -m "feat(auth): rate-limit login failures (5 attempts / 15min, ip+username)"
```

---

### Task 9: 生产 CORS 白名单 + JWT secret 强校验

**Files:**
- Modify: `backend/src/main/resources/application-prod.yml`
- Modify: `backend/src/main/java/com/study11408/security/JwtTokenProvider.java`(若未做)

- [ ] **Step 1: application-prod.yml 追加 app/cors 块**

文件末尾追加:

```yaml
app:
  jwt:
    secret: ${APP_JWT_SECRET}
  cors:
    allowed-origins: ${APP_CORS_ALLOWED_ORIGINS}
  turnstile:
    enabled: true
    secret-key: ${TURNSTILE_SECRET_KEY}
  mail:
    from: ${MAIL_FROM}
    from-name: ${MAIL_FROM_NAME:11408 学习平台}
```

> 不给 `${APP_JWT_SECRET}` 设默认值。生产没注入 → Spring 启动时 `IllegalArgumentException`,正是我们要的。

- [ ] **Step 2: JwtTokenProvider 校验 secret 长度**

如果 `@PostConstruct` 没有,在生效 secret 前加:

```java
    @jakarta.annotation.PostConstruct
    void validate() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException("APP_JWT_SECRET 必须设置且至少 32 字符");
        }
    }
```

(若已存在则跳过。)

- [ ] **Step 3: 启动 prod profile 验证缺失即报错**

Run:
```bash
cd backend && SPRING_PROFILES_ACTIVE=prod mvn -DskipTests spring-boot:run 2>&1 | head -40
```
Expected: 启动失败,日志含 `APP_JWT_SECRET` 缺失 / `Could not resolve placeholder 'APP_CORS_ALLOWED_ORIGINS'`。

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/resources/application-prod.yml backend/src/main/java/com/study11408/security/JwtTokenProvider.java
git commit -m "feat(security): prod profile requires APP_JWT_SECRET / CORS / Turnstile env injection"
```

---

### Task 10: 前端依赖 + types + api client

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/.env.example`(若不存在)

- [ ] **Step 1: 装 turnstile 包**

Run: `cd frontend && npm install @marsidev/react-turnstile`
Expected: package.json 多 `@marsidev/react-turnstile` 一项,无错误。

- [ ] **Step 2: types 改 LoginRequest / RegisterRequest**

打开 `frontend/src/types/index.ts`,改为:

```ts
export interface LoginRequest {
  username: string;
  password: string;
  turnstileToken?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  nickname?: string;
  emailCode: string;
  turnstileToken?: string;
}
```

- [ ] **Step 3: api.ts 加 sendEmailCode**

`authApi` 对象内追加:

```ts
  sendEmailCode: (email: string) =>
    api.post<unknown, ApiResponse<null>>("/auth/send-email-code", { email }),
```

- [ ] **Step 4: .env.example**

```
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

- [ ] **Step 5: 类型检查通过**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors(或仅老问题,不引入新错误)。

- [ ] **Step 6: 提交**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/types/index.ts frontend/src/lib/api.ts frontend/.env.example
git commit -m "feat(frontend): add Turnstile dep + sendEmailCode API + auth DTO fields"
```

---

### Task 11: TurnstileWidget 组件 + EmailCodeInput 组件

**Files:**
- Create: `frontend/src/components/TurnstileWidget.tsx`
- Create: `frontend/src/components/EmailCodeInput.tsx`

- [ ] **Step 1: TurnstileWidget**

```tsx
"use client";

import { Turnstile } from "@marsidev/react-turnstile";

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onToken, onExpire }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    // dev/未配置时不阻塞表单
    return null;
  }
  return (
    <Turnstile
      siteKey={siteKey}
      options={{ theme: "dark", size: "flexible" }}
      onSuccess={onToken}
      onExpire={() => {
        onToken("");
        onExpire?.();
      }}
      onError={() => onToken("")}
    />
  );
}
```

- [ ] **Step 2: EmailCodeInput**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

interface Props {
  email: string;
  value: string;
  onChange: (v: string) => void;
}

const COOLDOWN_SECONDS = 60;

export function EmailCodeInput({ email, value, onChange }: Props) {
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const send = async () => {
    setError(null);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("请先填写正确的邮箱");
      return;
    }
    setSending(true);
    try {
      await authApi.sendEmailCode(email);
      setCooldown(COOLDOWN_SECONDS);
      tickRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1 && tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
          return c - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "发送失败,请稍后重试");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">邮箱验证码</label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="6 位验证码"
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          required
        />
        <Button
          type="button"
          variant="outline"
          disabled={sending || cooldown > 0}
          onClick={send}
          className="shrink-0"
        >
          {cooldown > 0 ? `${cooldown}s` : sending ? "发送中..." : "发送验证码"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: 编译通过**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: 提交**

```bash
git add frontend/src/components/TurnstileWidget.tsx frontend/src/components/EmailCodeInput.tsx
git commit -m "feat(frontend): TurnstileWidget + EmailCodeInput components"
```

---

### Task 12: 登录/注册页集成 Turnstile + 验证码

**Files:**
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Modify: `frontend/src/app/(auth)/register/page.tsx`
- Modify: `frontend/src/stores/auth-store.ts`

- [ ] **Step 1: auth-store 透传 token**

(types 已扩展,直接透传即可,不用改实现 — store 的 `login(data)/register(data)` 已经原样传给 `authApi`。)
确认 store 没有把 `turnstileToken/emailCode` 丢掉 — 如果用 `{ ...data }` 直接传则 OK。

- [ ] **Step 2: 改 login/page.tsx**

把 `LoginInner` 内 form state 处追加:
```ts
  const [turnstileToken, setTurnstileToken] = useState("");
```

`handleSubmit` 中 `await login({ username, password })` 改为:
```ts
      await login({ username, password, turnstileToken });
```

form 里 `<Button type="submit" ...>` 之前插入:
```tsx
            <TurnstileWidget onToken={setTurnstileToken} />
```

并在文件顶部加 `import { TurnstileWidget } from "@/components/TurnstileWidget";`。

按钮的 `disabled` 改为:`disabled={isLoading || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)}`。

- [ ] **Step 3: 改 register/page.tsx**

form state 内追加:
```ts
  const [emailCode, setEmailCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
```

form JSX 中,邮箱 input 之后插入:
```tsx
            <EmailCodeInput email={form.email} value={emailCode} onChange={setEmailCode} />
```

`<Button type="submit" ...>` 之前插入:
```tsx
            <TurnstileWidget onToken={setTurnstileToken} />
```

`handleSubmit` 调用改为:
```ts
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        nickname: form.nickname || undefined,
        emailCode,
        turnstileToken,
      });
```

文件顶部 import:
```ts
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { EmailCodeInput } from "@/components/EmailCodeInput";
```

按钮 disabled 加 `|| !emailCode`。

- [ ] **Step 4: 跑 dev 手测**

Run: `cd frontend && npm run dev`
访问 http://localhost:3000/register,看到验证码输入框和"发送验证码"按钮(Turnstile 在未配 sitekey 时不渲染)。
按钮点击应发请求到 `/api/auth/send-email-code`(后端起着才能成功)。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/app/\(auth\)/login/page.tsx frontend/src/app/\(auth\)/register/page.tsx frontend/src/stores/auth-store.ts
git commit -m "feat(frontend): integrate Turnstile + email code on login/register pages"
```

---

### Task 13: docker-compose.yml 改成可被 .env 覆盖 + docker-compose.prod.yml

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Create: `docker-compose.prod.yml`

- [ ] **Step 1: docker-compose.yml 把硬编码密码改成占位(dev 行为不变)**

postgres 块:
```yaml
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-study11408}
      POSTGRES_USER: ${POSTGRES_USER:-study11408}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-study11408_dev}
```

minio 块:
```yaml
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin123}
```

backend 块:把所有数据库/MinIO/AI 字面值改成 `${VAR:-fallback}`,并新增:
```yaml
      APP_JWT_SECRET: ${APP_JWT_SECRET:-dev-only-jwt-secret-please-override-in-prod-environments-with-strong-key}
      APP_CORS_ALLOWED_ORIGINS: ${APP_CORS_ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:18081}
      TURNSTILE_ENABLED: ${TURNSTILE_ENABLED:-false}
      TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY:-}
      MAIL_HOST: ${MAIL_HOST:-smtp.qq.com}
      MAIL_PORT: ${MAIL_PORT:-465}
      MAIL_USERNAME: ${MAIL_USERNAME:-}
      MAIL_PASSWORD: ${MAIL_PASSWORD:-}
      MAIL_FROM: ${MAIL_FROM:-}
```

- [ ] **Step 2: .env.example 全量化**

完整内容:

```env
# ─── Postgres ───────────────────────────────────────────────────────────────
POSTGRES_DB=study11408
POSTGRES_USER=study11408
POSTGRES_PASSWORD=CHANGE_ME_strong_random_password

# ─── MinIO ──────────────────────────────────────────────────────────────────
MINIO_ROOT_USER=study11408
MINIO_ROOT_PASSWORD=CHANGE_ME_strong_random_password

# ─── Backend / JWT ──────────────────────────────────────────────────────────
# openssl rand -base64 64
APP_JWT_SECRET=CHANGE_ME_run_openssl_rand_base64_64

# ─── CORS 白名单(逗号分隔,生产填你的真实域名)─────────────────────────────
APP_CORS_ALLOWED_ORIGINS=https://your-domain.com

# ─── Mail (QQ SMTP 示例)────────────────────────────────────────────────────
# QQ 邮箱:设置 → 账户 → 开启"IMAP/SMTP 服务" → 生成授权码,密码用授权码
MAIL_HOST=smtp.qq.com
MAIL_PORT=465
MAIL_USERNAME=your_qq_id@qq.com
MAIL_PASSWORD=your_qq_smtp_auth_code
MAIL_FROM=your_qq_id@qq.com
MAIL_FROM_NAME=11408 学习平台

# ─── Cloudflare Turnstile (https://dash.cloudflare.com → Turnstile) ────────
TURNSTILE_ENABLED=true
TURNSTILE_SECRET_KEY=0x4AAAAAAAxxxxxxxxxxxxxxxx
# Frontend (build-time) — 写到 frontend/.env.production 或 compose build args
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAAxxxxxxxxxxxxxxxx

# ─── Monitoring profile ─────────────────────────────────────────────────────
GRAFANA_ADMIN_PASSWORD=CHANGE_ME_strong_password

# ─── 站点域名(给 nginx + Certbot 用)────────────────────────────────────
DOMAIN=your-domain.com
ACME_EMAIL=you@example.com
```

- [ ] **Step 3: docker-compose.prod.yml(生产覆盖)**

```yaml
services:
  postgres:
    ports: !reset []
    restart: unless-stopped

  redis:
    ports: !reset []
    restart: unless-stopped

  minio:
    ports: !reset []
    restart: unless-stopped

  ai-service:
    ports: !reset []
    restart: unless-stopped

  backend:
    restart: unless-stopped

  frontend:
    build:
      args:
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    ports: !reset []
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports: !override
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/certs:/etc/letsencrypt:ro
      - ./nginx/webroot:/var/www/certbot:ro
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
      - ai-service
```

> `!reset []` / `!override` 是 Compose 2.20+ 的合并控制语法。如果版本太老不识别,把 prod 块整段拷出来不要写 reset(完整重定义服务即可)。

- [ ] **Step 4: dev 仍可正常起**

Run: `docker compose up -d --build`
Expected: 容器全 healthy,前端 http://localhost:18081 能开。

- [ ] **Step 5: prod overlay 至少能解析**

Run: `docker compose -f docker-compose.yml -f docker-compose.prod.yml config > /tmp/merged.yml && head -50 /tmp/merged.yml`
Expected: 退出码 0,合并文件里 postgres/redis 没有 ports,nginx 有 80/443。

- [ ] **Step 6: 提交**

```bash
git add docker-compose.yml docker-compose.prod.yml .env.example
git commit -m "feat(ops): docker-compose.prod overlay + full .env.example for production secrets"
```

---

### Task 14: nginx 生产配置 (HTTPS + HSTS + 安全头 + 屏蔽 swagger/actuator)

**Files:**
- Create: `nginx/nginx.prod.conf`
- Create: `nginx/webroot/.gitkeep`(目录占位)
- Create: `nginx/certs/.gitkeep`

- [ ] **Step 1: nginx.prod.conf**

```nginx
upstream java_backend  { server backend:8080; }
upstream ai_service    { server ai-service:8000; }
upstream frontend      { server frontend:3000; }

# ── HTTP → HTTPS 跳转,留 ACME challenge 路径 ──────────────────────────────
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ── HTTPS 主服务 ────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name your-domain.com;  # ⚠️ 替换或用 envsubst 注入

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    client_max_body_size 100M;

    # 后端 API
    location /api/ {
        proxy_pass http://java_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # AI 服务(public 暴露的子路径,内部 OpenAPI 走 /api → backend)
    location /ai/ {
        proxy_pass http://ai_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }

    # 生产屏蔽 swagger / actuator(防信息泄漏)
    location ~ ^/(swagger-ui|v3/api-docs|actuator/(?!health|prometheus)).* {
        return 404;
    }

    # Next.js 前端
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

- [ ] **Step 2: 占位文件**

```bash
mkdir -p nginx/webroot nginx/certs
touch nginx/webroot/.gitkeep nginx/certs/.gitkeep
echo 'certs/' >> nginx/.gitignore || true
```

- [ ] **Step 3: 提交**

```bash
git add nginx/nginx.prod.conf nginx/webroot/.gitkeep nginx/certs/.gitkeep nginx/.gitignore
git commit -m "feat(ops): nginx prod config — HTTPS, HSTS, security headers, swagger/actuator gated"
```

---

### Task 15: 部署手册 docs/deploy-tencent.md

**Files:**
- Create: `docs/deploy-tencent.md`

- [ ] **Step 1: 写文档**

```markdown
# 腾讯云部署手册(11408study)

本文档把"买完服务器 → 上线"的所有手动操作写下来,假设你是第一次上腾讯云。

## 0. 前置准备(本地)

- 一个能 SSH 的本地终端
- 已经 fork / 拉好仓库到本地,准备好 `.env`(参照 `.env.example`)
- 一张已开通银联/微信支付的银行卡(腾讯云、域名都要)

## 1. 买服务器与域名

### 1.1 注册 + 实名

1. 打开 https://cloud.tencent.com,微信扫码注册
2. 控制台首页右上角"实名认证" → 个人(身份证 + 人脸)
3. 等 5-10 分钟通过

### 1.2 买轻量应用服务器

1. 顶栏搜"轻量应用服务器"(注意不是"云服务器 CVM")
2. 选 **广州** 或 **上海** 地域(同地域备案/续费方便)
3. 套餐:**2 核 4G 5Mbps / 80G SSD**(月付或 3 年付都行,3 年付便宜很多)
4. 镜像:**应用镜像 → Docker 20+**(已预装 docker 和 docker-compose),或纯系统 **Ubuntu 22.04 LTS** 自己装
5. 提交订单,等 1-2 分钟实例 Running

### 1.3 买域名(DNSPod)

1. 顶栏搜"域名注册"
2. 搜你想要的名字(`xxx408.com` / `xxxstudy.cn` 等),挑一个加入清单结账
3. 填**域名所有者**信息(姓名/身份证),提交"实名认证"(同账号实名过就快)

### 1.4 提交 ICP 备案(关键,2-3 周)

1. 控制台 → 备案管理 → 开始备案
2. 选轻量服务器和域名,系统自动关联
3. 上传:身份证正反面 + 手持身份证照片 + 域名证书(自动生成)
4. 等初审 1-3 工作日,初审过后再由通信管理局审,合计 2-3 周

> 备案前**不能用域名打开 80/443**;但可以先用 **服务器公网 IP 直连**(浏览器拦截 HTTPS 但 HTTP 可)做内部测试。

## 2. 服务器初始化

### 2.1 SSH 登录

控制台"轻量应用服务器"页面 → 实例 → 登录(网页 SSH)或"密钥/密码"标签获取 root 密码后:

```bash
ssh root@<公网IP>
```

### 2.2 安全基线

```bash
# 升级系统
apt update && apt upgrade -y

# 创建普通用户(避免 root 直接跑业务)
useradd -m -s /bin/bash deploy && usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys

# 改 SSH 端口(可选)+ 禁用密码登录
sed -i 's/^#Port 22/Port 22022/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 2.3 防火墙(轻量应用服务器**用网页"防火墙"而不是 ufw**)

腾讯云控制台 → 实例 → 防火墙 → 添加规则:

| 协议 | 端口 | 来源 | 备注 |
|---|---|---|---|
| TCP | 22022 | 你的家庭 IP/0.0.0.0/0 | SSH(改端口后) |
| TCP | 80 | 0.0.0.0/0 | HTTP(Certbot 验证 + 跳转) |
| TCP | 443 | 0.0.0.0/0 | HTTPS |

**不要**对外开 5432 / 6379 / 9000 / 9001 / 3000 / 8080 / 13000 等。

### 2.4 装 docker compose(如果镜像没预装)

```bash
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker
apt install -y docker-compose-plugin
docker compose version  # 应输出 v2.x
```

## 3. 部署项目

### 3.1 拉代码 + 配 env

```bash
su - deploy
git clone https://github.com/<you>/11408study.git
cd 11408study
cp .env.example .env

# 生成强密码
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')" >> .env.local
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')" >> .env.local
echo "APP_JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> .env.local

# 手动编辑 .env,把 .env.local 里的值填进去,再删除 .env.local
nano .env
```

### 3.2 拿 QQ SMTP 授权码

1. 打开 https://mail.qq.com → 顶栏"设置" → "账户"
2. 下拉"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务"
3. 开启"IMAP/SMTP 服务",按短信验证后**得到 16 位授权码**
4. 填入 `.env` 的 `MAIL_PASSWORD`(注意不是 QQ 登录密码)

### 3.3 注册 Cloudflare Turnstile

1. 打开 https://dash.cloudflare.com,注册账号
2. 左侧菜单 → Turnstile → Add site
3. Domain 填你的备案域名(没下来可以先填一个 widget-test domain)
4. Widget Mode 选 **Managed**(自动判断,体验最好)
5. 拿到 **Site Key** 和 **Secret Key**,分别填到 `.env` 的 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY`

### 3.4 第一次启动(用 IP 而非域名,测试用)

先把 `nginx/nginx.prod.conf` 里的 `your-domain.com` 改成 `_`(server_name 通配),并**注释掉**整个 443 server 块以及 80 → 443 跳转(留 80 location / 直接 proxy 到 frontend)。

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
docker compose logs -f --tail=50 backend
```

浏览器开 `http://<公网IP>` 应看到登录页。注册一个测试账号(此时 Turnstile 因为 sitekey 是 widget-test domain 也能过)。

### 3.5 备案下来后切 HTTPS

#### 3.5.1 DNS 解析

控制台 → 域名 → DNSPod 解析 → 添加记录:

| 类型 | 主机记录 | 解析线路 | 记录值 |
|---|---|---|---|
| A | @ | 默认 | <公网IP> |
| A | www | 默认 | <公网IP> |

等 DNS 生效(通常 5-30 分钟,`dig your-domain.com` 看到 IP 即可)。

#### 3.5.2 用 Certbot 签证书(webroot 模式)

```bash
sudo apt install -y certbot

# 第一次签证书前,nginx 必须能服务 /.well-known/acme-challenge/
# 临时方案:跑一个最小 nginx 只暴露 80,挂上 webroot
mkdir -p ~/11408study/nginx/webroot

sudo certbot certonly \
  --webroot -w ~/11408study/nginx/webroot \
  -d your-domain.com -d www.your-domain.com \
  --email you@example.com --agree-tos --no-eff-email

# 证书生成到 /etc/letsencrypt/live/your-domain.com/
# 把 nginx/certs 软链或拷贝过去:
sudo cp -rL /etc/letsencrypt ~/11408study/nginx/
sudo chown -R deploy:deploy ~/11408study/nginx/letsencrypt
mv ~/11408study/nginx/letsencrypt ~/11408study/nginx/certs
```

> 这里有个鸡和蛋问题:nginx.prod.conf 默认有 443 块引用证书文件,文件不存在 nginx 起不来。解决:**第一次先去掉 443 块**(只跑 80),签完证书后把 443 块加回来。

#### 3.5.3 nginx 切完整 prod 配置

把 `nginx/nginx.prod.conf` 里所有 `your-domain.com` 全局替换成你的真实域名,然后:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
curl -I https://your-domain.com  # 期待 200 + Strict-Transport-Security 头
```

#### 3.5.4 证书自动续签

```bash
sudo crontab -e
# 加一行(每天凌晨 3 点续签 + 重启 nginx)
0 3 * * * certbot renew --quiet && cp -rL /etc/letsencrypt /home/deploy/11408study/nginx/certs.new && rsync -a --delete /home/deploy/11408study/nginx/certs.new/ /home/deploy/11408study/nginx/certs/ && docker exec $(docker ps -qf name=nginx) nginx -s reload
```

### 3.6 数据库初次 seed

```bash
docker compose exec backend ls /app  # 确认容器活着
# Flyway 启动时自动跑 V1-V15,无需手动
```

测试注册流程:打开 https://your-domain.com/register → 填邮箱 → 发验证码 → 收件箱拿到 6 位码 → 通过 Turnstile → 注册成功。

## 4. 上线后必做的事

- [ ] 用 https://www.ssllabs.com/ssltest/ 测 SSL 评级(目标 A 以上)
- [ ] 用 https://securityheaders.com/ 测安全头(目标 A 以上)
- [ ] 加入云监控告警(腾讯云控制台 → 云监控 → 告警策略,CPU/内存/磁盘 > 80% 报警到微信)
- [ ] `scripts/backup-*.sh` 加到 crontab(参考 `scripts/` 目录)
- [ ] 把 `.env` 抄一份保存到密码管理器(1Password/Bitwarden),服务器一旦炸了好恢复

## 5. 常见踩坑

| 症状 | 排查 |
|---|---|
| 启动报 `APP_JWT_SECRET` 未注入 | `.env` 没复制 / docker compose 没读到 → 确认 `.env` 在 compose 同级目录 |
| 邮件没收到 | 检查 QQ 邮箱授权码;`docker compose logs backend grep -i mail`;垃圾邮件文件夹 |
| Turnstile 显示但前端拿不到 token | 看浏览器 console:sitekey 错 / 域名不匹配 |
| nginx 启动崩 ssl_certificate not found | 第一次部署没签证书就引用了 — 见 3.5.2 鸡和蛋说明 |
| 备案没下来但想公网访问 | 不能用域名,只能用 IP 直连 HTTP(443 + 域名腾讯云会拦) |
| 登录 429 太多次 | Redis `KEYS 'login:fail:*'` 看锁,`DEL` 清掉 |
```

- [ ] **Step 2: 提交**

```bash
git add docs/deploy-tencent.md
git commit -m "docs: tencent cloud deployment runbook — provisioning, ICP filing, HTTPS, ops"
```

---

## Verification — 最终上线前 smoke

> 这是上线前手动 checklist,不是新增代码。

- [ ] `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` 退出码 0
- [ ] 容器全 `healthy`:`docker compose ps`
- [ ] `curl -fsS https://your-domain.com/api/actuator/health` → `{"status":"UP"}`
- [ ] 浏览器隐身窗注册 → 收到邮箱码 → 注册成功 → 跳 dashboard
- [ ] 密码故意输错 5 次 → 第 6 次返回 429
- [ ] `curl -I https://your-domain.com` 含 `Strict-Transport-Security` / `X-Content-Type-Options`
- [ ] `curl -I https://your-domain.com/swagger-ui/index.html` → 404
- [ ] SSL Labs 评分 ≥ A
