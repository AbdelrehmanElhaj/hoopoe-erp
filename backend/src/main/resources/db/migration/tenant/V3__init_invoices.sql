-- =============================================================================
-- TENANT SCHEMA: Invoices (ZATCA Compliant)
-- =============================================================================

-- Customers (العملاء)
CREATE TABLE IF NOT EXISTS customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20) UNIQUE NOT NULL,
    name_ar         VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    vat_number      VARCHAR(15),
    cr_number       VARCHAR(20),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    address_line    TEXT,
    city            VARCHAR(100),
    country         VARCHAR(3) DEFAULT 'SA',
    account_id      UUID REFERENCES accounts(id),  -- ربط بحساب العملاء
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      UUID
);

-- Products / Services (المنتجات والخدمات)
CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE NOT NULL,
    name_ar         VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    unit_of_measure VARCHAR(20) DEFAULT 'PCE',
    unit_price      DECIMAL(18,2) NOT NULL,
    tax_category    VARCHAR(20) DEFAULT 'STANDARD'
                        CHECK (tax_category IN ('STANDARD', 'ZERO_RATED', 'EXEMPT')),
    revenue_account_id UUID REFERENCES accounts(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices (الفواتير - ZATCA Phase 2 compliant)
CREATE TABLE IF NOT EXISTS invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number      VARCHAR(50)  UNIQUE NOT NULL,   -- INV-2025-000001
    uuid                UUID         UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- ZATCA UUID
    invoice_type        VARCHAR(20)  NOT NULL DEFAULT 'STANDARD'
                            CHECK (invoice_type IN ('STANDARD', 'SIMPLIFIED')),
    invoice_subtype     VARCHAR(10)  NOT NULL DEFAULT '0100000',  -- ZATCA subtype code
    customer_id         UUID REFERENCES customers(id),

    -- Seller info (من تنظيمات الـ tenant)
    seller_name_ar      VARCHAR(200) NOT NULL,
    seller_vat_number   VARCHAR(15)  NOT NULL,
    seller_cr_number    VARCHAR(20),
    seller_address      TEXT,

    -- Buyer info
    buyer_name          VARCHAR(200),
    buyer_vat_number    VARCHAR(15),
    buyer_cr_number     VARCHAR(20),
    buyer_address       TEXT,

    -- Dates (ZATCA: UTC timezone)
    issue_datetime      TIMESTAMP WITH TIME ZONE NOT NULL,
    supply_date         DATE,
    supply_end_date     DATE,
    due_date            DATE,

    -- Amounts (BigDecimal: 18,2)
    subtotal            DECIMAL(18,2) NOT NULL,
    discount_amount     DECIMAL(18,2) NOT NULL DEFAULT 0,
    taxable_amount      DECIMAL(18,2) NOT NULL,
    vat_amount          DECIMAL(18,2) NOT NULL,
    total_amount        DECIMAL(18,2) NOT NULL,
    currency            VARCHAR(3)    DEFAULT 'SAR',

    -- Status
    status              VARCHAR(20)   DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),

    -- ZATCA Phase 1: QR
    qr_code_base64      TEXT,

    -- ZATCA Phase 2
    xml_content         TEXT,                           -- UBL 2.1 XML (أصلي)
    xml_hash            VARCHAR(64),                    -- SHA-256 hash of XML
    digital_signature   TEXT,                           -- ECDSA signature (Base64)
    certificate_hash    VARCHAR(64),                    -- SHA-256 of signing cert
    zatca_status        VARCHAR(20)   DEFAULT 'NOT_SUBMITTED'
                            CHECK (zatca_status IN (
                                'NOT_SUBMITTED', 'REPORTED', 'CLEARED',
                                'REJECTED', 'PENDING'
                            )),
    zatca_submission_id VARCHAR(100),
    zatca_response      JSONB,
    zatca_submitted_at  TIMESTAMP WITH TIME ZONE,
    zatca_cleared_at    TIMESTAMP WITH TIME ZONE,

    -- Credit note linkage
    original_invoice_id UUID REFERENCES invoices(id),
    is_credit_note      BOOLEAN DEFAULT false,

    -- Linked journal entry
    journal_entry_id    UUID REFERENCES journal_entries(id),

    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          UUID,
    updated_by          UUID,

    -- لا تعديل على فاتورة مؤكدة - يجب Credit Note بدلاً عنها
    CONSTRAINT no_edit_confirmed CHECK (
        status = 'DRAFT' OR created_at IS NOT NULL
    )
);

-- Invoice lines (سطور الفاتورة)
CREATE TABLE IF NOT EXISTS invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id),
    line_number     SMALLINT NOT NULL,
    product_id      UUID REFERENCES products(id),
    description_ar  VARCHAR(500) NOT NULL,
    description_en  VARCHAR(500),
    quantity        DECIMAL(18,4) NOT NULL,
    unit_price      DECIMAL(18,2) NOT NULL,
    unit_of_measure VARCHAR(20)  DEFAULT 'PCE',
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    taxable_amount  DECIMAL(18,2) NOT NULL,
    tax_category    VARCHAR(20)  DEFAULT 'STANDARD'
                        CHECK (tax_category IN ('STANDARD', 'ZERO_RATED', 'EXEMPT')),
    tax_rate        DECIMAL(5,2) DEFAULT 15.00,       -- 15% VAT in Saudi Arabia
    vat_amount      DECIMAL(18,2) NOT NULL,
    total_amount    DECIMAL(18,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_uuid ON invoices(uuid);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_datetime);
CREATE INDEX IF NOT EXISTS idx_invoices_zatca ON invoices(zatca_status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
