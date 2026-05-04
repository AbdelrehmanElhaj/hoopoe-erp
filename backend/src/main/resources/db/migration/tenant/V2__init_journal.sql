-- =============================================================================
-- TENANT SCHEMA: Journal Entries (القيود اليومية)
-- Double-entry bookkeeping core
-- =============================================================================

-- Journal entries header (رأس القيد)
CREATE TABLE IF NOT EXISTS journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number    VARCHAR(50)  UNIQUE NOT NULL,   -- JE-2025-000001
    entry_date      DATE NOT NULL,
    description     TEXT,
    reference       VARCHAR(100),                   -- رقم مرجعي (فاتورة، إيصال، إلخ)
    status          VARCHAR(20)  DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'POSTED', 'VOID')),
    source_type     VARCHAR(30),                    -- INVOICE, PAYMENT, MANUAL, OPENING
    source_id       UUID,
    fiscal_year_id  UUID REFERENCES fiscal_years(id),
    posted_by       UUID,
    posted_at       TIMESTAMP WITH TIME ZONE,
    void_reason     TEXT,
    voided_by       UUID,
    voided_at       TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID,
    -- يُمنع الحذف والتعديل بعد الترحيل قانونياً
    CONSTRAINT no_edit_posted CHECK (
        status = 'DRAFT' OR (voided_by IS NOT NULL OR posted_by IS NOT NULL)
    )
);

-- Journal entry lines (سطور القيد)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id        UUID NOT NULL REFERENCES journal_entries(id),
    line_number     SMALLINT NOT NULL,
    account_id      UUID NOT NULL REFERENCES accounts(id),
    cost_center_id  UUID REFERENCES cost_centers(id),
    debit           DECIMAL(18,2) NOT NULL DEFAULT 0
                        CHECK (debit >= 0),
    credit          DECIMAL(18,2) NOT NULL DEFAULT 0
                        CHECK (credit >= 0),
    description     TEXT,
    -- مبلغ واحد فقط > 0 في كل سطر
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit > 0 AND credit = 0) OR
        (credit > 0 AND debit = 0) OR
        (debit = 0 AND credit = 0)
    )
);

-- Account balances snapshot (لتسريع التقارير)
CREATE TABLE IF NOT EXISTS account_balances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    fiscal_year_id  UUID NOT NULL REFERENCES fiscal_years(id),
    period_month    SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    opening_debit   DECIMAL(18,2) DEFAULT 0,
    opening_credit  DECIMAL(18,2) DEFAULT 0,
    period_debit    DECIMAL(18,2) DEFAULT 0,
    period_credit   DECIMAL(18,2) DEFAULT 0,
    closing_debit   DECIMAL(18,2) DEFAULT 0,
    closing_credit  DECIMAL(18,2) DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (account_id, fiscal_year_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_je_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_je_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_je_source ON journal_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_jel_entry ON journal_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_account_period ON account_balances(account_id, fiscal_year_id, period_month);
