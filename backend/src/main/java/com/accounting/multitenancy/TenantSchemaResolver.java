package com.accounting.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantSchemaResolver implements CurrentTenantIdentifierResolver<String> {

    private static final String DEFAULT_SCHEMA = "public";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            return DEFAULT_SCHEMA;
        }
        return TenantContext.toSchemaName(tenantId);
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
