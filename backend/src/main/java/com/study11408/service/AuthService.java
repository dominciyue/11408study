package com.study11408.service;

import com.study11408.dto.*;
import com.study11408.entity.User;
import com.study11408.exception.BusinessException;
import com.study11408.repository.UserRepository;
import com.study11408.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String SEND_COOLDOWN_PREFIX = "email:code:cooldown:";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final VerificationCodeService verificationCodeService;
    private final EmailService emailService;
    private final StringRedisTemplate stringRedisTemplate;
    private final TurnstileService turnstileService;
    private final LoginAttemptService loginAttemptService;

    @Transactional
    public AuthResponse register(RegisterRequest request, String remoteIp) {
        requireTurnstile(request.getTurnstileToken(), remoteIp);
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

    public void sendEmailCode(String email) {
        // 已注册邮箱静默成功 — 防止 send-email-code 接口变成
        // "该邮箱是否已注册" 枚举预言机,被外部社工/钓鱼利用
        if (userRepository.existsByEmail(email)) {
            log.info("send-email-code: email already registered, swallowing");
            return;
        }
        Boolean firstSend = stringRedisTemplate.opsForValue()
                .setIfAbsent(SEND_COOLDOWN_PREFIX + email, "1", Duration.ofMinutes(1));
        if (Boolean.FALSE.equals(firstSend)) {
            throw new BusinessException("发送过于频繁,请 1 分钟后重试", HttpStatus.TOO_MANY_REQUESTS);
        }
        String code = verificationCodeService.generateAndStore(email);
        emailService.sendVerificationCode(email, code);
    }

    private void requireTurnstile(String token, String remoteIp) {
        if (!turnstileService.verify(token, remoteIp)) {
            throw new BusinessException("人机验证失败,请刷新页面重试");
        }
    }

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

    public AuthResponse refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException("无效的刷新令牌", HttpStatus.UNAUTHORIZED);
        }
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("无效的刷新令牌", HttpStatus.UNAUTHORIZED);
        }
        // 防止用 access token 当 refresh token：refresh token 必带 type=refresh
        // 否则任何被泄露的 24h access token 都能换出新的 access token，
        // 永远续命，越过短期 token 的安全边界。
        if (!"refresh".equals(jwtTokenProvider.getTokenType(refreshToken))) {
            throw new BusinessException("无效的刷新令牌", HttpStatus.UNAUTHORIZED);
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));

        String newToken = jwtTokenProvider.generateToken(username, user.getId());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(username);

        return AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .user(toUserDTO(user))
                .build();
    }

    public UserDTO getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));
        return toUserDTO(user);
    }

    private UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .build();
    }
}
