#!/usr/bin/env bash
# =============================================================================
# Hoopoe ERP — Saudi Market Demo Data Seed
# Creates a full tenant with realistic Saudi business data
#
# Usage:
#   ./seed-demo.sh                        # uses defaults
#   API_URL=http://localhost:8080/api ./seed-demo.sh
#   TENANT=my-company ./seed-demo.sh
# =============================================================================

set -euo pipefail
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# ─── Config (New Tenant: Al-Binyah Contracting) ─────────────────────────────
BASE_URL="${API_URL:-http://localhost:8080/api}"
TENANT="${TENANT:-al-binyah}"  # New Subdomain
OWNER_EMAIL="admin@albinyah.com.sa"
OWNER_PASSWORD="Secure@Pass2026"
OWNER_NAME_EN="Fahad Sulaiman Al-Rasheed"

COMPANY_NAME_AR="شركة البنية للمقاولات العامة"
COMPANY_NAME_EN="Al-Binyah General Contracting Co."
VAT_NUMBER="310555666700003"  # Unique Saudi VAT
CR_NUMBER="1010654321"        # Unique CR Number
ADDRESS_AR="طريق الملك عبدالعزيز، حي الياسمين، الرياض 13322"


# ─── Colours ─────────────────────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'
B='\033[0;34m'; C='\033[0;36m'; W='\033[1m'; N='\033[0m'

ok()      { echo -e "${G}✓${N} $*"; }
info()    { echo -e "${B}→${N} $*"; }
warn()    { echo -e "${Y}⚠${N} $*"; }
die()     { echo -e "${R}✗ ERROR:${N} $*" >&2; exit 1; }
section() { echo -e "\n${W}${C}══════════════════════════════════════════${N}"; \
            echo -e "${W}${C}  $*${N}"; \
            echo -e "${W}${C}══════════════════════════════════════════${N}"; }

# ─── HTTP helpers ─────────────────────────────────────────────────────────────
TOKEN=""

_curl_post() {
    local path="$1" body="$2"
    curl -s --max-time 30 -X POST "$BASE_URL$path" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -H "X-Tenant-ID: $TENANT" \
        ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
        --data-raw "$body"
}

_curl_get() {
    local path="$1"
    curl -s --max-time 30 "$BASE_URL$path" \
        -H "Accept: application/json" \
        -H "X-Tenant-ID: $TENANT" \
        ${TOKEN:+-H "Authorization: Bearer $TOKEN"}
}

check() {
    # $1=response $2=label  — dies on failure
    local resp="$1" label="$2"
    local success
    success=$(echo "$resp" | jq -r '.success // false' 2>/dev/null)
    if [[ "$success" == "true" ]]; then
        ok "$label"
    else
        local msg
        msg=$(echo "$resp" | jq -r '.message // .error // empty' 2>/dev/null || true)
        die "$label — ${msg:-$(echo "$resp" | head -c 200)}"
    fi
}

soft_check() {
    # $1=response $2=label  — warns but continues on failure
    local resp="$1" label="$2"
    local success
    success=$(echo "$resp" | jq -r '.success // false' 2>/dev/null)
    if [[ "$success" == "true" ]]; then
        ok "$label"
        return 0
    else
        local msg
        msg=$(echo "$resp" | jq -r '.message // .error // empty' 2>/dev/null || true)
        warn "$label — ${msg:-failed} (continuing)"
        return 1
    fi
}

get_id()   { echo "$1" | jq -r '.data.id'; }

acct_id() {
    # Lookup account UUID by code in cached $ACCOUNTS_JSON
    local code="$1"
    local id
    id=$(echo "$ACCOUNTS_JSON" | jq -r --arg c "$code" '.data[] | select(.code==$c) | .id' 2>/dev/null)
    if [[ -z "$id" || "$id" == "null" ]]; then
        die "Account code '$code' not found in chart of accounts"
    fi
    echo "$id"
}

# ─── Pre-flight ───────────────────────────────────────────────────────────────
section "Pre-flight"
command -v curl > /dev/null || die "curl is not installed"
command -v jq   > /dev/null || die "jq is not installed  →  sudo apt install jq"

info "Checking API at $BASE_URL ..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/actuator/health" 2>/dev/null || true)
if [[ "$HTTP_CODE" != "200" ]]; then
    die "Server not reachable at $BASE_URL  (HTTP $HTTP_CODE). Start the backend first."
fi
ok "Backend is running"
echo

# ─── 1. Register Tenant ───────────────────────────────────────────────────────
section "Step 1 — Register Tenant"
RESP=$(_curl_post "/public/tenants/register" "$(cat <<JSON
{
  "subdomain":     "$TENANT",
  "companyNameAr": "$COMPANY_NAME_AR",
  "companyNameEn": "$COMPANY_NAME_EN",
  "vatNumber":     "$VAT_NUMBER",
  "crNumber":      "$CR_NUMBER",
  "addressAr":     "$ADDRESS_AR",
  "ownerEmail":    "$OWNER_EMAIL",
  "ownerPassword": "$OWNER_PASSWORD",
  "ownerFullName": "$OWNER_NAME_EN"
}
JSON
)")
SUCCESS=$(echo "$RESP" | jq -r '.success // false' 2>/dev/null)
MSG=$(echo "$RESP" | jq -r '.message // ""' 2>/dev/null)
if [[ "$SUCCESS" == "true" ]]; then
    ok "Tenant '$TENANT' registered"
elif echo "$MSG" | grep -qi "already\|conflict\|subdomain\|vat"; then
    warn "Tenant '$TENANT' already exists — skipping registration, will login with existing credentials"
else
    die "Tenant registration failed: $MSG"
fi

# ─── 2. Login ────────────────────────────────────────────────────────────────
section "Step 2 — Login"
RESP=$(_curl_post "/auth/login" "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASSWORD\"}")
TOKEN=$(echo "$RESP" | jq -r '.data.accessToken // empty')
[[ -n "$TOKEN" ]] || die "Login failed — $(echo "$RESP" | jq -r '.message // "no token"')"
ok "Authenticated as $OWNER_EMAIL"

# ─── 3. Load Default Chart of Accounts ───────────────────────────────────────
section "Step 3 — Load Chart of Accounts"
ACCOUNTS_JSON=$(_curl_get "/accounts")
ACCOUNT_COUNT=$(echo "$ACCOUNTS_JSON" | jq '.data | length')
ok "Loaded $ACCOUNT_COUNT accounts"

# Cache the IDs we'll use in journal entries
ID_CASH=$(acct_id "110101")
ID_BANK=$(acct_id "110102")
ID_AR=$(acct_id "110201")
ID_VAT_IN=$(acct_id "1103")
ID_AP=$(acct_id "210101")
ID_VAT_OUT=$(acct_id "2102")
ID_CAPITAL=$(acct_id "3101")
ID_RETAINED=$(acct_id "3102")
ID_SALES=$(acct_id "410101")
ID_COGS=$(acct_id "5101")
ID_SALARIES=$(acct_id "520101")
ID_RENT=$(acct_id "520102")
ID_COMMS=$(acct_id "520103")
ID_BANK_CHG=$(acct_id "520104")

# Parent IDs for sub-accounts
ID_P_CASH_GRP=$(echo "$ACCOUNTS_JSON" | jq -r '.data[] | select(.code=="1101") | .id')
ID_P_FIXED=$(echo "$ACCOUNTS_JSON"    | jq -r '.data[] | select(.code=="1201") | .id')
ID_P_ADMIN=$(echo "$ACCOUNTS_JSON"    | jq -r '.data[] | select(.code=="5201") | .id')
info "Account IDs cached"

# ─── 4. Add Sub-Accounts ────────────────────────────────────────────────────
section "Step 4 — Additional Sub-Accounts"

RESP=$(_curl_post "/accounts" "$(cat <<JSON
{
  "code": "110103", "nameAr": "بنك الراجحي",
  "nameEn": "Al Rajhi Bank", "accountType": "ASSET",
  "normalBalance": "DEBIT", "parentId": "$ID_P_CASH_GRP",
  "description": "الحساب الجاري لدى بنك الراجحي"
}
JSON
)")
check "$RESP" "Sub-account: Al Rajhi Bank (110103)"
ID_RAJHI=$(get_id "$RESP")

RESP=$(_curl_post "/accounts" "$(cat <<JSON
{
  "code": "110104", "nameAr": "بنك الإنماء",
  "nameEn": "Alinma Bank", "accountType": "ASSET",
  "normalBalance": "DEBIT", "parentId": "$ID_P_CASH_GRP",
  "description": "الحساب الجاري لدى بنك الإنماء"
}
JSON
)")
check "$RESP" "Sub-account: Alinma Bank (110104)"
ID_ALINMA=$(get_id "$RESP")

RESP=$(_curl_post "/accounts" "$(cat <<JSON
{
  "code": "120103", "nameAr": "أجهزة الحاسوب والخوادم",
  "nameEn": "Computers & Servers", "accountType": "ASSET",
  "normalBalance": "DEBIT", "parentId": "$ID_P_FIXED",
  "description": "أصول تقنية المعلومات المكتسبة"
}
JSON
)")
check "$RESP" "Sub-account: Computers & Servers (120103)"
ID_COMPUTERS=$(get_id "$RESP")

RESP=$(_curl_post "/accounts" "$(cat <<JSON
{
  "code": "520105", "nameAr": "مصروفات المواصلات والسفر",
  "nameEn": "Travel & Transport Expenses", "accountType": "EXPENSE",
  "normalBalance": "DEBIT", "parentId": "$ID_P_ADMIN",
  "description": "وقود وتذاكر سفر وبدل مواصلات"
}
JSON
)")
check "$RESP" "Sub-account: Travel & Transport (520105)"
ID_TRAVEL=$(get_id "$RESP")

RESP=$(_curl_post "/accounts" "$(cat <<JSON
{
  "code": "520106", "nameAr": "مصروفات التسويق والإعلان",
  "nameEn": "Marketing & Advertising", "accountType": "EXPENSE",
  "normalBalance": "DEBIT", "parentId": "$ID_P_ADMIN",
  "description": "حملات تسويق رقمي وإعلانات"
}
JSON
)")
check "$RESP" "Sub-account: Marketing & Advertising (520106)"
ID_MARKETING=$(get_id "$RESP")

# Reload accounts after additions
ACCOUNTS_JSON=$(_curl_get "/accounts")

# ─── 5. Contacts ─────────────────────────────────────────────────────────────
section "Step 5 — Contacts (Customers & Suppliers)"

# ── Customers ──────────────────────────────────────────────────────────────
RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "شركة أرامكو السعودية للتوزيع",
  "nameEn":      "Saudi Aramco Distribution Co.",
  "contactType": "CUSTOMER",
  "vatNumber":   "300001746410003",
  "crNumber":    "2055009299",
  "phone":       "+966138720000",
  "email":       "ap@aramco.sa",
  "address":     "شارع الأمير محمد بن فهد، الظهران 34465",
  "notes":       "عميل رئيسي — قطاع البترول والطاقة. شروط دفع: 45 يوم"
}
JSON
)")
check "$RESP" "Customer: Saudi Aramco"
C_ARAMCO=$(get_id "$RESP")

RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "شركة الاتصالات السعودية STC",
  "nameEn":      "Saudi Telecom Company STC",
  "contactType": "CUSTOMER",
  "vatNumber":   "300002154810003",
  "crNumber":    "1010158394",
  "phone":       "+96611220200",
  "email":       "vendor@stc.com.sa",
  "address":     "طريق الملك عبدالعزيز، الرياض 12333",
  "notes":       "عميل قطاع الاتصالات. شروط دفع: 30 يوم"
}
JSON
)")
check "$RESP" "Customer: STC"
C_STC=$(get_id "$RESP")

RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "مجموعة المراعي للأغذية",
  "nameEn":      "Almarai Food Group",
  "contactType": "CUSTOMER",
  "vatNumber":   "300000273710003",
  "crNumber":    "1010084223",
  "phone":       "+96614741555",
  "email":       "procurement@almarai.com",
  "address":     "طريق المطار القديم، الرياض 11481",
  "notes":       "عميل صناعة الأغذية والمشروبات. عقد سنوي"
}
JSON
)")
check "$RESP" "Customer: Almarai"
C_ALMARAI=$(get_id "$RESP")

RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "شركة الرياض للتطوير العقاري",
  "nameEn":      "Riyadh Development Real Estate Co.",
  "contactType": "CUSTOMER",
  "vatNumber":   "300003567810003",
  "crNumber":    "1010245678",
  "phone":       "+966114512233",
  "email":       "finance@riyadhdev.sa",
  "address":     "حي الورود، طريق الملك فهد، الرياض 12271",
  "notes":       "عميل قطاع العقارات والتطوير"
}
JSON
)")
check "$RESP" "Customer: Riyadh Development"
C_RIYADH=$(get_id "$RESP")

RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "مؤسسة العوض للتجارة العامة",
  "nameEn":      "Al-Awad General Trading Est.",
  "contactType": "CUSTOMER",
  "vatNumber":   "300004892310003",
  "crNumber":    "1010334521",
  "phone":       "+966501234567",
  "email":       "info@alawad-trading.sa",
  "address":     "حي البطحاء، شارع الديرة، الرياض 11411",
  "notes":       "تجارة عامة — مشتريات متكررة"
}
JSON
)")
check "$RESP" "Customer: Al-Awad Trading"
C_ALAWAD=$(get_id "$RESP")

# ── Suppliers ──────────────────────────────────────────────────────────────
RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "مصنع الجزيرة للورق والطباعة",
  "nameEn":      "Al-Jazeera Paper & Printing Factory",
  "contactType": "SUPPLIER",
  "vatNumber":   "300005123410003",
  "crNumber":    "2055123456",
  "phone":       "+966122344567",
  "email":       "sales@aljazeera-print.sa",
  "address":     "المنطقة الصناعية الثانية، جدة 21432",
  "notes":       "مورد مواد الطباعة والقرطاسية. كريدت 30 يوم"
}
JSON
)")
check "$RESP" "Supplier: Al-Jazeera Printing"
S_PRINT=$(get_id "$RESP")

RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "شركة زين السعودية للاتصالات",
  "nameEn":      "Zain Saudi Arabia",
  "contactType": "SUPPLIER",
  "vatNumber":   "300006234510003",
  "crNumber":    "1010567891",
  "phone":       "+96614000112",
  "email":       "enterprise@sa.zain.com",
  "address":     "طريق الملك عبدالله، الرياض 12384",
  "notes":       "مزود خدمات الاتصالات والإنترنت"
}
JSON
)")
check "$RESP" "Supplier: Zain Telecom"
S_ZAIN=$(get_id "$RESP")

RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "مؤسسة الأمانة للخدمات والصيانة",
  "nameEn":      "Al-Amanah Maintenance & Services",
  "contactType": "SUPPLIER",
  "vatNumber":   "300007345610003",
  "crNumber":    "1010789012",
  "phone":       "+966550123456",
  "email":       "contact@alamanah.sa",
  "address":     "حي السليمانية، الرياض 12221",
  "notes":       "خدمات تنظيف وصيانة — عقد سنوي"
}
JSON
)")
check "$RESP" "Supplier: Al-Amanah Services"
S_AMANAH=$(get_id "$RESP")

RESP=$(_curl_post "/contacts" "$(cat <<'JSON'
{
  "nameAr":      "شركة الحجاز للمعدات والتجهيزات المكتبية",
  "nameEn":      "Al-Hijaz Office Equipment & Supplies Co.",
  "contactType": "BOTH",
  "vatNumber":   "300008456710003",
  "crNumber":    "4030123456",
  "phone":       "+966122345678",
  "email":       "info@alhijaz-equip.sa",
  "address":     "شارع فلسطين، جدة 21451",
  "notes":       "مورد وعميل — أثاث ومعدات مكتبية"
}
JSON
)")
check "$RESP" "Contact (BOTH): Al-Hijaz Equipment"
C_HIJAZ=$(get_id "$RESP")

# ─── 6. Standard Invoices (B2B / فواتير ضريبية) ──────────────────────────────
section "Step 6 — Standard Invoices B2B"

SELLER_BLOCK="\"sellerNameAr\":\"$COMPANY_NAME_AR\",\"sellerVatNumber\":\"$VAT_NUMBER\",\"sellerCrNumber\":\"$CR_NUMBER\",\"sellerAddress\":\"$ADDRESS_AR\""

# Invoice 1 — IT Consulting to Aramco  (43,750 + VAT)
RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "STANDARD",
  $SELLER_BLOCK,
  "buyerName":       "شركة أرامكو السعودية للتوزيع",
  "buyerVatNumber":  "300001746410003",
  "buyerAddress":    "شارع الأمير محمد بن فهد، الظهران 34465",
  "issueDatetime":   "2026-02-01T08:00:00Z",
  "supplyDate":      "2026-02-01",
  "dueDate":         "2026-03-18",
  "items": [
    {
      "descriptionAr":  "خدمات استشارية تقنية — تحليل الأنظمة وهندسة البرمجيات",
      "descriptionEn":  "IT Consulting — Systems Analysis & Software Engineering",
      "quantity":       "1.0000",
      "unitPrice":      "30000.00",
      "unitOfMeasure":  "SER",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    },
    {
      "descriptionAr":  "تدريب الكوادر التقنية — 5 أيام",
      "descriptionEn":  "Technical Staff Training — 5 Days",
      "quantity":       "5.0000",
      "unitPrice":      "2750.00",
      "unitOfMeasure":  "DAY",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV1=$(get_id "$RESP")
check "$RESP" "Invoice 1 DRAFT: IT Consulting → Aramco"
RESP=$(_curl_post "/invoices/$INV1/confirm" "{}")
soft_check "$RESP" "Invoice 1 CONFIRMED" || true

# Invoice 2 — ERP Software License to STC  (31,500 + VAT)
RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "STANDARD",
  $SELLER_BLOCK,
  "buyerName":       "شركة الاتصالات السعودية STC",
  "buyerVatNumber":  "300002154810003",
  "buyerAddress":    "طريق الملك عبدالعزيز، الرياض 12333",
  "issueDatetime":   "2026-02-15T09:00:00Z",
  "supplyDate":      "2026-02-15",
  "dueDate":         "2026-03-17",
  "items": [
    {
      "descriptionAr":  "تراخيص نظام إدارة الموارد المؤسسية ERP — طبعة المؤسسات",
      "descriptionEn":  "ERP System Licenses — Enterprise Edition (10 users)",
      "quantity":       "10.0000",
      "unitPrice":      "2500.00",
      "unitOfMeasure":  "LIC",
      "discountPercent":"10.00",
      "taxCategory":    "STANDARD"
    },
    {
      "descriptionAr":  "خدمات التخصيص والضبط والتكامل",
      "descriptionEn":  "Customization, Configuration & Integration Services",
      "quantity":       "3.0000",
      "unitPrice":      "2000.00",
      "unitOfMeasure":  "DAY",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV2=$(get_id "$RESP")
check "$RESP" "Invoice 2 DRAFT: ERP Licenses → STC"
RESP=$(_curl_post "/invoices/$INV2/confirm" "{}")
soft_check "$RESP" "Invoice 2 CONFIRMED" || true

# Invoice 3 — ZATCA-Compliant Accounting System → Almarai  (75,000 + VAT)
RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "STANDARD",
  $SELLER_BLOCK,
  "buyerName":       "مجموعة المراعي للأغذية",
  "buyerVatNumber":  "300000273710003",
  "buyerAddress":    "طريق المطار القديم، الرياض 11481",
  "issueDatetime":   "2026-03-01T10:00:00Z",
  "supplyDate":      "2026-03-01",
  "dueDate":         "2026-04-15",
  "items": [
    {
      "descriptionAr":  "تطوير نظام محاسبة ومالية متكامل متوافق مع متطلبات هيئة الزكاة والضريبة والجمارك",
      "descriptionEn":  "ZATCA-Compliant Integrated Accounting & Finance System Development",
      "quantity":       "1.0000",
      "unitPrice":      "55000.00",
      "unitOfMeasure":  "SER",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    },
    {
      "descriptionAr":  "وحدة التقارير المالية والتدقيق",
      "descriptionEn":  "Financial Reporting & Audit Module",
      "quantity":       "1.0000",
      "unitPrice":      "12000.00",
      "unitOfMeasure":  "SER",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    },
    {
      "descriptionAr":  "خدمات النشر والتهجير والتدريب",
      "descriptionEn":  "Deployment, Migration & Training Services",
      "quantity":       "4.0000",
      "unitPrice":      "2000.00",
      "unitOfMeasure":  "DAY",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV3=$(get_id "$RESP")
check "$RESP" "Invoice 3 DRAFT: Accounting System → Almarai  (DRAFT — pending approval)"
# Intentionally left as DRAFT to show workflow

# Invoice 4 — Maintenance Contract → Riyadh Dev  (12,500 + VAT)
RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "STANDARD",
  $SELLER_BLOCK,
  "buyerName":       "شركة الرياض للتطوير العقاري",
  "buyerVatNumber":  "300003567810003",
  "buyerAddress":    "حي الورود، طريق الملك فهد، الرياض 12271",
  "issueDatetime":   "2026-03-15T11:00:00Z",
  "supplyDate":      "2026-03-15",
  "dueDate":         "2026-04-15",
  "items": [
    {
      "descriptionAr":  "عقد صيانة وتحديث أنظمة تقنية المعلومات — ربع سنوي",
      "descriptionEn":  "IT Systems Maintenance & Upgrade Contract — Quarterly",
      "quantity":       "1.0000",
      "unitPrice":      "8000.00",
      "unitOfMeasure":  "SER",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    },
    {
      "descriptionAr":  "دعم فني على مدار الساعة — 3 أشهر",
      "descriptionEn":  "24/7 Technical Support — 3 Months",
      "quantity":       "3.0000",
      "unitPrice":      "1500.00",
      "unitOfMeasure":  "MON",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV4=$(get_id "$RESP")
check "$RESP" "Invoice 4 DRAFT: Maintenance Contract → Riyadh Dev"
RESP=$(_curl_post "/invoices/$INV4/confirm" "{}")
soft_check "$RESP" "Invoice 4 CONFIRMED" || true

# Invoice 5 — Digital Transformation Consulting → Al-Awad  (18,000 + VAT)
RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "STANDARD",
  $SELLER_BLOCK,
  "buyerName":       "مؤسسة العوض للتجارة العامة",
  "buyerVatNumber":  "300004892310003",
  "buyerAddress":    "حي البطحاء، شارع الديرة، الرياض 11411",
  "issueDatetime":   "2026-04-01T08:30:00Z",
  "supplyDate":      "2026-04-01",
  "dueDate":         "2026-05-01",
  "items": [
    {
      "descriptionAr":  "دراسة وتصميم خطة التحول الرقمي",
      "descriptionEn":  "Digital Transformation Study & Design",
      "quantity":       "1.0000",
      "unitPrice":      "15000.00",
      "unitOfMeasure":  "SER",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    },
    {
      "descriptionAr":  "ورش عمل وتدريب الكوادر",
      "descriptionEn":  "Workshops & Staff Training",
      "quantity":       "2.0000",
      "unitPrice":      "1500.00",
      "unitOfMeasure":  "DAY",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV5=$(get_id "$RESP")
check "$RESP" "Invoice 5 DRAFT: Digital Transformation → Al-Awad"
RESP=$(_curl_post "/invoices/$INV5/confirm" "{}")
soft_check "$RESP" "Invoice 5 CONFIRMED" || true

# ─── 7. Simplified Invoices (B2C / فواتير مبسّطة) ────────────────────────────
section "Step 7 — Simplified Invoices B2C"

RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "SIMPLIFIED",
  $SELLER_BLOCK,
  "issueDatetime": "2026-04-10T13:00:00Z",
  "supplyDate":    "2026-04-10",
  "items": [
    {
      "descriptionAr":  "أدوات مكتبية وقرطاسية متنوعة",
      "descriptionEn":  "Office Stationery & Supplies",
      "quantity":       "10.0000",
      "unitPrice":      "45.00",
      "unitOfMeasure":  "PCE",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV6=$(get_id "$RESP")
check "$RESP" "Invoice 6 DRAFT: Office Supplies (Simplified)"
RESP=$(_curl_post "/invoices/$INV6/confirm" "{}")
soft_check "$RESP" "Invoice 6 CONFIRMED" || true

RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "SIMPLIFIED",
  $SELLER_BLOCK,
  "issueDatetime": "2026-04-14T14:00:00Z",
  "supplyDate":    "2026-04-14",
  "items": [
    {
      "descriptionAr":  "خدمات طباعة وتصوير وثائق",
      "descriptionEn":  "Document Printing & Photocopying",
      "quantity":       "500.0000",
      "unitPrice":      "0.50",
      "unitOfMeasure":  "SHT",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    },
    {
      "descriptionAr":  "تجليد وتغليف وثائق",
      "descriptionEn":  "Document Binding & Packaging",
      "quantity":       "5.0000",
      "unitPrice":      "15.00",
      "unitOfMeasure":  "PCE",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV7=$(get_id "$RESP")
check "$RESP" "Invoice 7 DRAFT: Printing Services (Simplified)"
RESP=$(_curl_post "/invoices/$INV7/confirm" "{}")
soft_check "$RESP" "Invoice 7 CONFIRMED" || true

RESP=$(_curl_post "/invoices" "$(cat <<JSON
{
  "invoiceType": "SIMPLIFIED",
  $SELLER_BLOCK,
  "issueDatetime": "2026-04-20T10:00:00Z",
  "supplyDate":    "2026-04-20",
  "items": [
    {
      "descriptionAr":  "اشتراك شهري — خدمات الدعم التقني عن بُعد",
      "descriptionEn":  "Monthly Subscription — Remote Technical Support",
      "quantity":       "1.0000",
      "unitPrice":      "750.00",
      "unitOfMeasure":  "MON",
      "discountPercent":"0.00",
      "taxCategory":    "STANDARD"
    }
  ]
}
JSON
)")
INV8=$(get_id "$RESP")
check "$RESP" "Invoice 8 DRAFT: Remote Support Subscription (Simplified)"
RESP=$(_curl_post "/invoices/$INV8/confirm" "{}")
soft_check "$RESP" "Invoice 8 CONFIRMED" || true

# ─── 8. Journal Entries ──────────────────────────────────────────────────────
section "Step 8 — Journal Entries"

post_je() {
    # $1=label  $2=JSON body  — creates and posts the entry
    local label="$1" body="$2"
    local resp je_id
    resp=$(_curl_post "/journal-entries" "$body")
    check "$resp" "$label — created"
    je_id=$(get_id "$resp")
    resp=$(_curl_post "/journal-entries/$je_id/post" "{}")
    soft_check "$resp" "$label — posted" || true
}

draft_je() {
    # $1=label  $2=JSON body  — creates entry (DRAFT only)
    local label="$1" body="$2"
    local resp
    resp=$(_curl_post "/journal-entries" "$body")
    check "$resp" "$label — DRAFT"
}

# JE-01: Opening capital — Bank Al-Ahli
post_je "JE-01: Opening Capital (1,000,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-01-01",
  "description": "رصيد افتتاحي — رأس المال المدفوع — بداية السنة المالية 2026",
  "reference":   "OB-2026-001",
  "lines": [
    { "accountId": "$ID_BANK",    "debit": "1000000.00", "credit": "0.00",       "description": "إيداع رأس المال في البنك الأهلي" },
    { "accountId": "$ID_CAPITAL", "debit": "0.00",       "credit": "1000000.00", "description": "رأس المال المدفوع — مساهمة المالك" }
  ]
}
JSON
)"

# JE-02: Cash withdrawal for petty cash
post_je "JE-02: Petty Cash Withdrawal (50,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-01-05",
  "description": "سحب نقدي لتمويل الصندوق — مصروفات تشغيل يومية",
  "reference":   "CASH-2026-001",
  "lines": [
    { "accountId": "$ID_CASH", "debit": "50000.00", "credit": "0.00",      "description": "رصيد الصندوق" },
    { "accountId": "$ID_BANK", "debit": "0.00",     "credit": "50000.00",  "description": "سحب من البنك الأهلي" }
  ]
}
JSON
)"

# JE-03: Computer equipment purchase
post_je "JE-03: Computer Equipment Purchase (35,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-01-10",
  "description": "شراء أجهزة حاسوب وخوادم لمكتب الشركة",
  "reference":   "ASSET-2026-001",
  "lines": [
    { "accountId": "$ID_COMPUTERS", "debit": "35000.00", "credit": "0.00",     "description": "أجهزة حاسوب وخوادم ومعدات شبكة" },
    { "accountId": "$ID_BANK",      "debit": "0.00",     "credit": "35000.00", "description": "تحويل بنكي للمورد" }
  ]
}
JSON
)"

# JE-04: Office rent — January
post_je "JE-04: Office Rent January (18,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-01-01",
  "description": "إيجار مقر الشركة — شهر يناير 2026",
  "reference":   "RENT-2026-01",
  "lines": [
    { "accountId": "$ID_RENT", "debit": "18000.00", "credit": "0.00",     "description": "إيجار المكتب — طريق الملك فهد" },
    { "accountId": "$ID_BANK", "debit": "0.00",     "credit": "18000.00", "description": "تحويل بنكي لصاحب العقار" }
  ]
}
JSON
)"

# JE-05: Salaries — January
post_je "JE-05: Salaries January (52,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-01-31",
  "description": "صرف رواتب الموظفين — شهر يناير 2026",
  "reference":   "SAL-2026-01",
  "lines": [
    { "accountId": "$ID_SALARIES", "debit": "52000.00", "credit": "0.00",     "description": "رواتب وبدلات وحوافز الموظفين" },
    { "accountId": "$ID_BANK",     "debit": "0.00",     "credit": "52000.00", "description": "تحويلات رواتب بنكية" }
  ]
}
JSON
)"

# JE-06: Office rent — February
post_je "JE-06: Office Rent February (18,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-02-01",
  "description": "إيجار مقر الشركة — شهر فبراير 2026",
  "reference":   "RENT-2026-02",
  "lines": [
    { "accountId": "$ID_RENT", "debit": "18000.00", "credit": "0.00",     "description": "إيجار المكتب — طريق الملك فهد" },
    { "accountId": "$ID_BANK", "debit": "0.00",     "credit": "18000.00", "description": "تحويل بنكي لصاحب العقار" }
  ]
}
JSON
)"

# JE-07: Salaries — February
post_je "JE-07: Salaries February (52,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-02-28",
  "description": "صرف رواتب الموظفين — شهر فبراير 2026",
  "reference":   "SAL-2026-02",
  "lines": [
    { "accountId": "$ID_SALARIES", "debit": "52000.00", "credit": "0.00",     "description": "رواتب وبدلات وحوافز الموظفين" },
    { "accountId": "$ID_BANK",     "debit": "0.00",     "credit": "52000.00", "description": "تحويلات رواتب بنكية" }
  ]
}
JSON
)"

# JE-08: Communications — Q1 (Zain invoice)
post_je "JE-08: Communications Q1 (4,200 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-03-05",
  "description": "فاتورة خدمات الاتصالات والإنترنت — شركة زين — يناير ومارس 2026",
  "reference":   "COMM-ZAIN-Q1-2026",
  "lines": [
    { "accountId": "$ID_COMMS", "debit": "4200.00", "credit": "0.00",    "description": "خدمات الاتصالات والإنترنت Q1" },
    { "accountId": "$ID_BANK",  "debit": "0.00",    "credit": "4200.00", "description": "سداد فاتورة زين" }
  ]
}
JSON
)"

# JE-09: Office rent — March
post_je "JE-09: Office Rent March (18,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-03-01",
  "description": "إيجار مقر الشركة — شهر مارس 2026",
  "reference":   "RENT-2026-03",
  "lines": [
    { "accountId": "$ID_RENT", "debit": "18000.00", "credit": "0.00",     "description": "إيجار المكتب — طريق الملك فهد" },
    { "accountId": "$ID_BANK", "debit": "0.00",     "credit": "18000.00", "description": "تحويل بنكي لصاحب العقار" }
  ]
}
JSON
)"

# JE-10: Salaries — March
post_je "JE-10: Salaries March (52,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-03-31",
  "description": "صرف رواتب الموظفين — شهر مارس 2026",
  "reference":   "SAL-2026-03",
  "lines": [
    { "accountId": "$ID_SALARIES", "debit": "52000.00", "credit": "0.00",     "description": "رواتب وبدلات وحوافز الموظفين" },
    { "accountId": "$ID_BANK",     "debit": "0.00",     "credit": "52000.00", "description": "تحويلات رواتب بنكية" }
  ]
}
JSON
)"

# JE-11: Bank charges Q1
post_je "JE-11: Bank Charges Q1 (875 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-03-31",
  "description": "مصروفات بنكية وعمولات تحويل — الربع الأول 2026",
  "reference":   "BCHG-Q1-2026",
  "lines": [
    { "accountId": "$ID_BANK_CHG", "debit": "875.00", "credit": "0.00",   "description": "عمولات وخدمات البنك الأهلي Q1" },
    { "accountId": "$ID_BANK",     "debit": "0.00",   "credit": "875.00", "description": "خصم من الحساب البنكي تلقائياً" }
  ]
}
JSON
)"

# JE-12: Travel & transport Q1
post_je "JE-12: Travel & Transport Q1 (6,500 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-03-31",
  "description": "مصروفات المواصلات والسفر — الربع الأول 2026",
  "reference":   "TRAVEL-Q1-2026",
  "lines": [
    { "accountId": "$ID_TRAVEL", "debit": "6500.00", "credit": "0.00",    "description": "وقود وتذاكر سفر وبدل انتقال" },
    { "accountId": "$ID_CASH",   "debit": "0.00",    "credit": "6500.00", "description": "سداد من الصندوق" }
  ]
}
JSON
)"

# JE-13: Marketing campaign
post_je "JE-13: Marketing Campaign (12,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-04-01",
  "description": "حملة تسويق رقمي على منصات التواصل الاجتماعي — Q2 2026",
  "reference":   "MKT-2026-Q2",
  "lines": [
    { "accountId": "$ID_MARKETING", "debit": "12000.00", "credit": "0.00",     "description": "إعلانات رقمية وتسويق محتوى" },
    { "accountId": "$ID_BANK",      "debit": "0.00",     "credit": "12000.00", "description": "تحويل لوكالة التسويق" }
  ]
}
JSON
)"

# JE-14: Office rent April (DRAFT — current month)
draft_je "JE-14: Office Rent April — DRAFT (18,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-04-01",
  "description": "إيجار مقر الشركة — شهر أبريل 2026",
  "reference":   "RENT-2026-04",
  "lines": [
    { "accountId": "$ID_RENT", "debit": "18000.00", "credit": "0.00",     "description": "إيجار المكتب — طريق الملك فهد" },
    { "accountId": "$ID_BANK", "debit": "0.00",     "credit": "18000.00", "description": "تحويل بنكي لصاحب العقار" }
  ]
}
JSON
)"

# JE-15: Salaries April (DRAFT)
draft_je "JE-15: Salaries April — DRAFT (52,000 SAR)" "$(cat <<JSON
{
  "entryDate":   "2026-04-30",
  "description": "صرف رواتب الموظفين — شهر أبريل 2026",
  "reference":   "SAL-2026-04",
  "lines": [
    { "accountId": "$ID_SALARIES", "debit": "52000.00", "credit": "0.00",     "description": "رواتب وبدلات وحوافز الموظفين" },
    { "accountId": "$ID_BANK",     "debit": "0.00",     "credit": "52000.00", "description": "تحويلات رواتب بنكية" }
  ]
}
JSON
)"

# ─── Summary ──────────────────────────────────────────────────────────────────
section "Done!"
cat <<SUMMARY

${W}Tenant Details${N}
  Subdomain   :  ${C}$TENANT${N}         ← use as X-Tenant-ID header
  Email       :  ${C}$OWNER_EMAIL${N}
  Password    :  ${C}$OWNER_PASSWORD${N}
  Company     :  $COMPANY_NAME_AR
  VAT Number  :  $VAT_NUMBER

${W}Data Created${N}
  Accounts    :  17 default + 5 sub-accounts added
  Contacts    :  5 customers + 3 suppliers + 1 both (Al-Hijaz)
  Invoices    :  5 standard B2B  (4 confirmed, 1 draft)
               + 3 simplified B2C (confirmed)
  Journal     :  13 posted entries + 2 draft (April)

${W}Financial Snapshot (excl. VAT)${N}
  Opening Capital        : 1,000,000 SAR
  Revenue (invoiced)     :  ~199,750 SAR
  Salaries (3 months)    :   156,000 SAR
  Rent (3 months)        :    54,000 SAR
  Other Expenses         :    23,575 SAR

${G}Login at:${N}  http://localhost:3000
SUMMARY
