package com.accounting.modules.accounts.controller;

import com.accounting.modules.accounts.dto.AccountRequest;
import com.accounting.modules.accounts.dto.AccountResponse;
import com.accounting.modules.accounts.entity.Account;
import com.accounting.modules.accounts.repository.AccountRepository;
import com.accounting.shared.dto.ApiResponse;
import com.accounting.shared.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountRepository accountRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> findAll() {
        List<AccountResponse> accounts = accountRepository.findByActiveTrue().stream()
                .map(AccountResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> tree() {
        List<AccountResponse> roots = accountRepository.findRootAccounts().stream()
                .map(AccountResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(roots));
    }

    @GetMapping("/postable")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> postable() {
        List<AccountResponse> accounts = accountRepository.findByLeafTrueAndActiveTrue().stream()
                .map(AccountResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> findById(@PathVariable UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Account not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(AccountResponse.from(account)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> create(@Valid @RequestBody AccountRequest request) {
        if (accountRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Account code already exists", HttpStatus.CONFLICT);
        }

        Account parent = null;
        if (request.getParentId() != null) {
            parent = accountRepository.findById(request.getParentId())
                    .orElseThrow(() -> new BusinessException("Parent account not found", HttpStatus.NOT_FOUND));
            // Parent is no longer a leaf once it has children
            parent.setLeaf(false);
            accountRepository.save(parent);
        }

        Account account = Account.builder()
                .code(request.getCode())
                .nameAr(request.getNameAr())
                .nameEn(request.getNameEn())
                .accountType(request.getAccountType())
                .normalBalance(request.getNormalBalance())
                .parent(parent)
                .level(parent != null ? parent.getLevel() + 1 : 1)
                .leaf(true)
                .active(true)
                .description(request.getDescription())
                .build();

        account = accountRepository.save(account);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(AccountResponse.from(account)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody AccountRequest request) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Account not found", HttpStatus.NOT_FOUND));

        account.setNameAr(request.getNameAr());
        account.setNameEn(request.getNameEn());
        account.setDescription(request.getDescription());

        account = accountRepository.save(account);
        return ResponseEntity.ok(ApiResponse.ok(AccountResponse.from(account)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Account not found", HttpStatus.NOT_FOUND));

        account.setActive(false);
        accountRepository.save(account);
        return ResponseEntity.ok(ApiResponse.ok(null, "Account deactivated"));
    }
}
