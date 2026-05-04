package com.accounting.modules.tenant.service;

import com.accounting.modules.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantMigrationRunner implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) {
        tenantRepository.findAll().forEach(tenant -> {
            try {
                Flyway.configure()
                        .dataSource(dataSource)
                        .schemas(tenant.getSchemaName())
                        .locations("classpath:db/migration/tenant")
                        .defaultSchema(tenant.getSchemaName())
                        .load()
                        .migrate();
                log.info("Migrations applied for tenant: {}", tenant.getSubdomain());
            } catch (Exception e) {
                log.error("Migration failed for tenant {}: {}", tenant.getSubdomain(), e.getMessage());
            }
        });
    }
}
