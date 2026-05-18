package com.study11408.controller;

import com.study11408.dto.*;
import com.study11408.security.JwtTokenProvider;
import com.study11408.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "认证管理", description = "用户注册、登录、刷新令牌")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "发送邮箱注册验证码")
    @PostMapping("/send-email-code")
    public ApiResponse<Void> sendEmailCode(@Valid @RequestBody SendEmailCodeRequest request) {
        authService.sendEmailCode(request.getEmail());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @Operation(summary = "刷新令牌")
    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        return ApiResponse.ok(authService.refreshToken(refreshToken));
    }

    @Operation(summary = "获取当前登录用户")
    @GetMapping("/me")
    public ApiResponse<UserDTO> me(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        Long userId = jwtTokenProvider.getUserId(token);
        return ApiResponse.ok(authService.getCurrentUser(userId));
    }
}
