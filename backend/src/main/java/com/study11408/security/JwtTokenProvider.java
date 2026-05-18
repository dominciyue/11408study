package com.study11408.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expiration;
    private final long refreshExpiration;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration}") long expiration,
            @Value("${app.jwt.refresh-expiration}") long refreshExpiration) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "app.jwt.secret 未配置 — prod 模式必须通过 APP_JWT_SECRET 环境变量注入(openssl rand -base64 64)");
        }
        byte[] decoded;
        try {
            decoded = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("app.jwt.secret 不是合法的 Base64 字符串", e);
        }
        if (decoded.length < 32) {
            throw new IllegalStateException(
                "app.jwt.secret 解码后必须 ≥ 32 字节(HMAC-SHA256 最低要求);当前 " + decoded.length + " 字节");
        }
        this.key = Keys.hmacShaKeyFor(decoded);
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
    }

    /**
     * @deprecated 该重载不写入 userId claim，会导致下游接口（如 NoteController/MaterialController
     * 等通过 {@link #getUserId(String)}）拿不到用户 ID。新代码请用
     * {@link #generateToken(String, Long)}。保留仅为兼容历史调用。
     */
    @Deprecated
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateToken(userDetails.getUsername());
    }

    /**
     * @deprecated 该重载不写入 userId claim，会导致下游接口（如 NoteController/MaterialController
     * 等通过 {@link #getUserId(String)}）拿不到用户 ID。新代码请用
     * {@link #generateToken(String, Long)}。保留仅为兼容历史调用。
     */
    @Deprecated
    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateToken(String username, Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .claim("type", "refresh")
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String resolveToken(jakarta.servlet.http.HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    public Long getUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Object userId = claims.get("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    /** access token 缺 type 字段，refresh token 写入 "refresh"。 */
    public String getTokenType(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Object type = claims.get("type");
        return type == null ? "access" : String.valueOf(type);
    }
}
