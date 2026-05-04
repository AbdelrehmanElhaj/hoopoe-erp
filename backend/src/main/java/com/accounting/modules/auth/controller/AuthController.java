package com.accounting.modules.auth.controller;

import com.accounting.modules.auth.dto.LoginRequest;
import com.accounting.modules.auth.dto.LoginResponse;
import com.accounting.modules.auth.service.AuthService;
import com.accounting.multitenancy.TenantContext;
import com.accounting.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId) {

        LoginResponse response = authService.login(request,
                tenantId != null ? tenantId : TenantContext.getCurrentTenant());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }
}
