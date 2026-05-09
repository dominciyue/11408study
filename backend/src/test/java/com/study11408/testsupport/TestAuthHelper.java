package com.study11408.testsupport;

import com.study11408.entity.User;
import com.study11408.repository.UserRepository;
import com.study11408.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TestAuthHelper {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public User ensureUser(String username) {
        return userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.save(User.builder()
                        .username(username)
                        .email(username + "@test.local")
                        .password(passwordEncoder.encode("password"))
                        .nickname(username)
                        .role("USER")
                        .build()));
    }

    public String bearerFor(User user) {
        // include userId claim so controllers can extract it
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getId());
        return "Bearer " + token;
    }
}

