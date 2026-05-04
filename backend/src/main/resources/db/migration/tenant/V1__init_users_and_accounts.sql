-- =============================================================================
-- TENANT SCHEMA: Users, Roles, Chart of Accounts
-- Applied per-tenant after schema creation
-- =============================================================================

-- Users (per-tenant)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name_ar    VARCHAR(200),
    full_name_en    VARCHAR(200) NOT NULL,
    role            VARCHAR(30)  NOT NULL DEFAULT 'ACCOUNTANT'
                        CHECK (role IN ('OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER')),
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID
);

-- Chart of Accounts (شجرة الحسابات)
CREATE TABLE IF NOT EXISTS accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20)  UNIQUE NOT NULL,
    name_ar         VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    account_type    VARCHAR(20)  NOT NULL
                        CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    normal_balance  VARCHAR(10)  NOT NULL
                        CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    parent_id       UUID REFERENCES accounts(id),
    level           SMALLINT     NOT NULL CHECK (level BETWEEN 1 AND 5),
    is_leaf         BOOLEAN      DEFAULT true,
    is_active       BOOLEAN      DEFAULT true,
    -- Prevent posting to parent accounts
    allow_posting   BOOLEAN      GENERATED ALWAYS AS (is_leaf) STORED,
    description     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID
);

-- Fiscal years (السنوات المالية)
CREATE TABLE IF NOT EXISTS fiscal_years (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20)  DEFAULT 'OPEN'
                        CHECK (status IN ('OPEN', 'CLOSED', 'LOCKED')),
    closed_at       TIMESTAMP WITH TIME ZONE,
    closed_by       UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fy_dates_check CHECK (end_date > start_date)
);

-- Cost centers (مراكز التكلفة) - optional
CREATE TABLE IF NOT EXISTS cost_centers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20)  UNIQUE NOT NULL,
    name_ar         VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    parent_id       UUID REFERENCES cost_centers(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================================================
-- Default Chart of Accounts (Saudi GAAP - دليل الحسابات السعودي)
-- =============================================================================
INSERT INTO accounts (code, name_ar, name_en, account_type, normal_balance, level, is_leaf) VALUES
-- Assets (الأصول)
('1', 'الأصول', 'Assets', 'ASSET', 'DEBIT', 1, false),
('11', 'الأصول المتداولة', 'Current Assets', 'ASSET', 'DEBIT', 2, false),
('1101', 'النقدية وما يعادلها', 'Cash and Equivalents', 'ASSET', 'DEBIT', 3, false),
('110101', 'الصندوق', 'Cash on Hand', 'ASSET', 'DEBIT', 4, true),
('110102', 'البنك الأهلي', 'Al Ahli Bank', 'ASSET', 'DEBIT', 4, true),
('1102', 'العملاء والذمم المدينة', 'Accounts Receivable', 'ASSET', 'DEBIT', 3, false),
('110201', 'العملاء - محلي', 'Local Customers', 'ASSET', 'DEBIT', 4, true),
('1103', 'ضريبة القيمة المضافة المدخلات', 'VAT Input', 'ASSET', 'DEBIT', 3, true),
('12', 'الأصول غير المتداولة', 'Non-Current Assets', 'ASSET', 'DEBIT', 2, false),
('1201', 'الأصول الثابتة', 'Fixed Assets', 'ASSET', 'DEBIT', 3, false),
('120101', 'الأثاث والمعدات', 'Furniture and Equipment', 'ASSET', 'DEBIT', 4, true),
('120102', 'مجمع اهتلاك الأثاث', 'Acc. Depreciation - Furniture', 'ASSET', 'CREDIT', 4, true),
-- Liabilities (الخصوم)
('2', 'الخصوم', 'Liabilities', 'LIABILITY', 'CREDIT', 1, false),
('21', 'الخصوم المتداولة', 'Current Liabilities', 'LIABILITY', 'CREDIT', 2, false),
('2101', 'الموردون والذمم الدائنة', 'Accounts Payable', 'LIABILITY', 'CREDIT', 3, false),
('210101', 'الموردون - محلي', 'Local Suppliers', 'LIABILITY', 'CREDIT', 4, true),
('2102', 'ضريبة القيمة المضافة المخرجات', 'VAT Output', 'LIABILITY', 'CREDIT', 3, true),
('2103', 'ضريبة القيمة المضافة المستحقة', 'VAT Payable', 'LIABILITY', 'CREDIT', 3, true),
-- Equity (حقوق الملكية)
('3', 'حقوق الملكية', 'Equity', 'EQUITY', 'CREDIT', 1, false),
('3101', 'رأس المال', 'Capital', 'EQUITY', 'CREDIT', 2, true),
('3102', 'الأرباح المحتجزة', 'Retained Earnings', 'EQUITY', 'CREDIT', 2, true),
('3103', 'الأرباح والخسائر', 'Net Income', 'EQUITY', 'CREDIT', 2, true),
-- Revenue (الإيرادات)
('4', 'الإيرادات', 'Revenue', 'REVENUE', 'CREDIT', 1, false),
('4101', 'إيرادات المبيعات', 'Sales Revenue', 'REVENUE', 'CREDIT', 2, false),
('410101', 'مبيعات خاضعة للضريبة', 'Taxable Sales', 'REVENUE', 'CREDIT', 3, true),
('410102', 'مبيعات معفاة', 'Exempt Sales', 'REVENUE', 'CREDIT', 3, true),
-- Expenses (المصروفات)
('5', 'المصروفات', 'Expenses', 'EXPENSE', 'DEBIT', 1, false),
('5101', 'تكلفة المبيعات', 'Cost of Goods Sold', 'EXPENSE', 'DEBIT', 2, true),
('5201', 'المصروفات الإدارية', 'Admin Expenses', 'EXPENSE', 'DEBIT', 2, false),
('520101', 'الرواتب والأجور', 'Salaries and Wages', 'EXPENSE', 'DEBIT', 3, true),
('520102', 'إيجار المكتب', 'Office Rent', 'EXPENSE', 'DEBIT', 3, true),
('520103', 'الاتصالات والإنترنت', 'Communications', 'EXPENSE', 'DEBIT', 3, true),
('520104', 'مصروفات مصرفية', 'Bank Charges', 'EXPENSE', 'DEBIT', 3, true);
