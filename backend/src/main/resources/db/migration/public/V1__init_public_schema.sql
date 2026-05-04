-- =============================================================================
-- PUBLIC SCHEMA: Global tables (tenants, super admins)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants (companies)
CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain       VARCHAR(50)  UNIQUE NOT NULL,
    company_name_ar VARCHAR(200) NOT NULL,
    company_name_en VARCHAR(200),
    vat_number      VARCHAR(15)  UNIQUE NOT NULL,   -- رقم ضريبي: 15 رقماً يبدأ بـ 3
    cr_number       VARCHAR(20),                     -- سجل تجاري
    address_ar      TEXT,
    address_en      TEXT,
    city            VARCHAR(100),
    country         VARCHAR(3)   DEFAULT 'SA',
    schema_name     VARCHAR(63)  UNIQUE NOT NULL,    -- PostgreSQL schema name
    status          VARCHAR(20)  DEFAULT 'ACTIVE'    -- ACTIVE, SUSPENDED, CANCELLED
                        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
    plan            VARCHAR(20)  DEFAULT 'BASIC'     -- BASIC, STANDARD, ENTERPRISE
                        CHECK (plan IN ('BASIC', 'STANDARD', 'ENTERPRISE')),
    -- ZATCA Phase 2 certificates (encrypted)
    zatca_cert_pem          TEXT,
    zatca_private_key_enc   TEXT,                    -- AES-encrypted private key
    zatca_cert_serial       VARCHAR(100),
    zatca_onboarded_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Super admins (platform level, not tenant level)
CREATE TABLE IF NOT EXISTS super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_vat ON tenants(vat_number);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
