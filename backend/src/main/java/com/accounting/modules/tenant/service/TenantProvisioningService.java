package com.accounting.modules.tenant.service;

import com.accounting.modules.auth.entity.User;
import com.accounting.modules.auth.service.AuthService;
import com.accounting.modules.tenant.dto.CreateTenantRequest;
import com.accounting.modules.tenant.entity.Tenant;
import com.accounting.modules.tenant.repository.TenantRepository;
import com.accounting.multitenancy.TenantContext;
import com.accounting.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantProvisioningService {

    private final TenantRepository tenantRepository;
    private final AuthService authService;
    private final DataSource dataSource;

    public Tenant createTenant(CreateTenantRequest request) {
        if (tenantRepository.existsBySubdomain(request.getSubdomain())) {
            throw new BusinessException("Subdomain already taken", HttpStatus.CONFLICT);
        }
        if (tenantRepository.existsByVatNumber(request.getVatNumber())) {
            throw new BusinessException("VAT number already registered", HttpStatus.CONFLICT);
        }

        // Schema derived from subdomain so TenantSchemaResolver always resolves correctly
        String schemaName = TenantContext.toSchemaName(request.getSubdomain());

        Tenant tenant = Tenant.builder()
                .subdomain(request.getSubdomain())
                .companyNameAr(request.getCompanyNameAr())
                .companyNameEn(request.getCompanyNameEn())
                .vatNumber(request.getVatNumber())
                .crNumber(request.getCrNumber())
                .addressAr(request.getAddressAr())
                .schemaName(schemaName)
                .plan(Tenant.TenantPlan.BASIC)
                .build();

        tenant = tenantRepository.save(tenant);

        // 1. Create PostgreSQL schema + run Flyway migrations
        provisionSchema(schemaName);

        // 2. Switch to tenant schema and create the owner user
        TenantContext.setCurrentTenant(tenant.getSubdomain());
        try {
            authService.createUser(
                    request.getOwnerEmail(),
                    request.getOwnerPassword(),
                    request.getOwnerFullName(),
                    User.UserRole.OWNER
            );
            log.info("Owner user created for tenant: {}", tenant.getSubdomain());
        } finally {
            TenantContext.clear();
        }

        log.info("Tenant provisioned: {} → schema: {}", tenant.getSubdomain(), schemaName);
        return tenant;
    }

    private void provisionSchema(String schemaName) {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);
            log.info("Schema created: {}", schemaName);
        } catch (SQLException e) {
            throw new BusinessException("Failed to create tenant schema: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/migration/tenant")
                .defaultSchema(schemaName)
                .load();

        flyway.migrate();
        log.info("Migrations applied for schema: {}", schemaName);
    }
}
