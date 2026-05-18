package com.study11408.config;

import com.study11408.security.JwtAuthenticationFilter;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(unauthorizedEntryPoint())
            )
            .authorizeHttpRequests(auth -> auth
                // 仅 login / register / refresh 公开；/me 必须带 JWT
                .requestMatchers("/auth/login", "/auth/register", "/auth/refresh").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                // P0-11 收紧：health/info/prometheus 公开（health 由前端拉、
                // prometheus 由 docker 内网 scrape）；其他 actuator 端点未在
                // management.endpoints.web.exposure.include 列表里，根本不会注册，
                // 所以无需再 hasRole('ADMIN') 兜底——但保留 deny 双保险防错配。
                .requestMatchers("/actuator/health", "/actuator/info", "/actuator/prometheus").permitAll()
                .requestMatchers("/actuator/**").denyAll()
                // 预置学习路径目录：游客也能浏览（登陆前首页/推荐区会拉，详情页直接深链可访问）
                .requestMatchers("/study-paths/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
