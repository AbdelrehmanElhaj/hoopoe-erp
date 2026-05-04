package com.accounting.multitenancy;

public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new InheritableThreadLocal<>();

    private TenantContext() {}

    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void setCurrentTenant(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }

    public static String toSchemaName(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID cannot be blank");
        }
        // tenant_abc123 - safe for PostgreSQL schema names
        return "tenant_" + tenantId.toLowerCase().replaceAll("[^a-z0-9_]", "_");
    }
}
