package com.accounting.modules.auth.service;

import com.accounting.modules.auth.dto.LoginRequest;
import com.accounting.modules.auth.dto.LoginResponse;
import com.accounting.modules.auth.entity.User;
import com.accounting.modules.auth.repository.UserRepository;
import com.accounting.modules.auth.security.JwtTokenProvider;
import com.accounting.multitenancy.TenantContext;
import com.accounting.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public LoginResponse login(LoginRequest request, String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new BusinessException("Tenant ID is required", HttpStatus.BAD_REQUEST);
        }

        // TenantContext is already set by TenantInterceptor
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isActive()) {
            throw new BusinessException("Account is disabled", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String accessToken = tokenProvider.generateToken(
                user.getId(), user.getEmail(), tenantId, user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), tenantId);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(expirationMs / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullNameEn())
                .role(user.getRole().name())
                .tenantId(tenantId)
                .build();
    }

    public User createUser(String email, String password, String fullName, User.UserRole role) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email already in use", HttpStatus.CONFLICT);
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .fullNameEn(fullName)
                .role(role)
                .active(true)
                .build();
        return userRepository.save(user);
    }
}
