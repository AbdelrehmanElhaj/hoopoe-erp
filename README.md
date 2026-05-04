# Hoopoe ERP — Saudi Accounting System

A multi-tenant, ZATCA Phase 2–compliant accounting SaaS built for Saudi Arabia. Each company gets an isolated PostgreSQL schema, full double-entry bookkeeping, VAT-ready invoicing, and real-time financial reports.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run with Docker Compose](#run-with-docker-compose)
  - [Run Locally (Development)](#run-locally-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Multitenancy](#multitenancy)
- [ZATCA Compliance](#zatca-compliance)
- [Database Migrations](#database-migrations)
- [Financial Reports](#financial-reports)

---

## Features

- **Multi-tenant** — schema-per-tenant isolation; tenant identified by `X-Tenant-ID` request header
- **ZATCA Phase 2** — ECDSA digital signatures, UBL 2.1 XML, QR code generation, clearance & reporting APIs
- **Double-entry Journal** — balanced journal entries with posting/void lifecycle
- **VAT Invoicing** — standard & simplified invoices, 15% VAT, zero-rated, and exempt line items
- **Chart of Accounts** — hierarchical account tree with posting rules
- **Financial Reports** — trial balance, balance sheet, income statement, VAT report (with Excel export)
- **PDF Invoices** — generated server-side with PDFBox
- **JWT Auth** — stateless authentication with 24-hour access tokens and 7-day refresh tokens
- **Role-based Access** — OWNER, ADMIN, ACCOUNTANT roles with method-level security
- **Arabic UI** — RTL Angular Material interface, full Arabic labels

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Angular 19 Frontend               │
│   (Angular Material · RTL · SheetJS Excel export)  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/JSON  X-Tenant-ID header
┌──────────────────────▼──────────────────────────────┐
│              Spring Boot 3.4.5 Backend              │
│                                                     │
│  JwtAuthFilter → TenantInterceptor → Controllers   │
│                                                     │
│  Modules: auth · accounts · invoice · journal       │
│           reports · tenant · zatca                  │
└──────────────────────┬──────────────────────────────┘
                       │ JDBC (schema-per-tenant)
┌──────────────────────▼──────────────────────────────┐
│                    PostgreSQL 16                     │
│                                                     │
│  public schema  →  shared (tenants table)           │
│  tenant_<id>    →  per-tenant (users, accounts,     │
│                    invoices, journal_entries, …)    │
└─────────────────────────────────────────────────────┘
```

### Request Flow

1. Request arrives with `X-Tenant-ID: <subdomain>` header
2. `JwtAuthFilter` validates the JWT and sets `SecurityContext`
3. `TenantInterceptor` resolves the subdomain → tenant UUID → sets `TenantContext` (ThreadLocal)
4. `TenantConnectionProvider` switches the Hibernate connection to `tenant_<uuid>` schema
5. Service layer executes within `@Transactional`; all SQL hits the correct schema
6. Response mapped to DTO and wrapped in `ApiResponse<T>`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, Angular Material, RxJS, SheetJS (xlsx), moment-hijri |
| Backend | Spring Boot 3.4.5, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16, Flyway migrations, HikariCP |
| Auth | JWT (JJWT 0.12.6) — HS512, 24h access / 7d refresh |
| ZATCA | BouncyCastle 1.79 (ECDSA), ZXing 3.5.3 (QR), PDFBox 3.0.3 (PDF) |
| Containerization | Docker, Docker Compose |
| Language | Java 17, TypeScript 5.6 |

---

## Project Structure

```
accounting-system/
├── backend/
│   ├── src/main/java/com/accounting/
│   │   ├── modules/
│   │   │   ├── accounts/          # Chart of accounts (entity, repo, service, controller)
│   │   │   ├── auth/              # Login, JWT, User entity
│   │   │   ├── invoice/           # Invoices, items, VAT calc, PDF, ZATCA submission
│   │   │   ├── journal/           # Journal entries, lines, post/void lifecycle
│   │   │   ├── reports/           # Trial balance, balance sheet, P&L, VAT report
│   │   │   ├── tenant/            # Tenant provisioning, profile management
│   │   │   └── zatca/             # ECDSA signing, XML, QR, certificate, API client
│   │   ├── multitenancy/          # TenantContext, interceptor, schema routing
│   │   ├── config/                # Security, Flyway, CORS, web config
│   │   └── shared/                # ApiResponse, AuditEntity, BusinessException
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/
│           ├── public/            # V1__init_public_schema.sql
│           └── tenant/            # V1..V4 per-tenant schema migrations
├── frontend/
│   └── src/app/
│       ├── core/
│       │   ├── services/          # auth, account, invoice, journal, report, tenant, zatca, export
│       │   ├── guards/            # auth.guard.ts
│       │   └── interceptors/      # jwt.interceptor.ts
│       ├── features/
│       │   ├── auth/login/
│       │   ├── accounts/list/
│       │   ├── invoices/          # list, create, view
│       │   ├── journal/           # list, create
│       │   ├── reports/           # hub, trial-balance, balance-sheet, income-statement, vat-report
│       │   ├── settings/          # tenant profile editor
│       │   └── zatca/             # onboarding & certificate management
│       └── layout/shell/          # sidebar navigation, toolbar
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Docker & Docker Compose **or** Java 17 + Maven 3.9 + Node 20 + PostgreSQL 16

### Run with Docker Compose

```bash
# 1. Clone
git clone git@github.com:AbdelrehmanElhaj/hoopoe-erp.git
cd hoopoe-erp

# 2. Configure environment
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, PRIVATE_KEY_ENCRYPTION_KEY

# 3. Start all services
docker compose up -d

# Frontend → http://localhost:4200
# Backend  → http://localhost:8080/api
```

### Run Locally (Development)

**Backend**

```bash
cd backend

# Ensure PostgreSQL is running and accounting_db exists
# Then:
mvn spring-boot:run
# API available at http://localhost:8080/api
```

**Frontend**

```bash
cd frontend
npm install
ng serve
# App available at http://localhost:4200
# Dev proxy forwards /api calls to :8080
```

**Register your first tenant**

```bash
curl -X POST http://localhost:8080/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "mycompany",
    "companyNameAr": "اسم الشركة",
    "vatNumber": "300000000000003",
    "ownerEmail": "owner@mycompany.sa",
    "ownerPassword": "SecurePass@123",
    "ownerFullName": "الاسم الكامل"
  }'
```

**Login**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: mycompany" \
  -d '{"email":"owner@mycompany.sa","password":"SecurePass@123"}'
```

---

## Environment Variables

Copy `.env.example` to `.env` and set:

| Variable | Description | Example |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/accounting_db` |
| `DB_USER` | Database username | `accounting_user` |
| `DB_PASSWORD` | Database password | *(strong password)* |
| `JWT_SECRET` | HS512 signing secret (≥ 64 bytes base64) | `openssl rand -base64 64` |
| `PRIVATE_KEY_ENCRYPTION_KEY` | AES key for ZATCA private keys (32 chars) | `openssl rand -base64 32` |
| `ZATCA_ENV` | `sandbox` or `production` | `sandbox` |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:
- `Authorization: Bearer <JWT>`
- `X-Tenant-ID: <subdomain>`

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token for new access token |

### Invoices

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/invoices` | Any | Paginated invoice list |
| GET | `/invoices/{id}` | Any | Invoice detail |
| POST | `/invoices` | OWNER/ADMIN/ACCOUNTANT | Create draft invoice |
| POST | `/invoices/{id}/confirm` | OWNER/ADMIN/ACCOUNTANT | Confirm + submit to ZATCA |
| POST | `/invoices/{id}/cancel` | OWNER/ADMIN | Cancel draft invoice |
| POST | `/invoices/{id}/submit-zatca` | OWNER/ADMIN | Resubmit to ZATCA |
| GET | `/invoices/{id}/pdf` | Any | Download invoice PDF |

### Journal Entries

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/journal-entries` | Any | Paginated journal list |
| GET | `/journal-entries/{id}` | Any | Entry detail |
| POST | `/journal-entries` | OWNER/ADMIN/ACCOUNTANT | Create draft entry |
| POST | `/journal-entries/{id}/post` | OWNER/ADMIN/ACCOUNTANT | Post entry to ledger |
| POST | `/journal-entries/{id}/void` | OWNER/ADMIN | Void a posted entry |

### Chart of Accounts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/accounts` | Full account tree |
| POST | `/accounts` | Create account |
| PUT | `/accounts/{id}` | Update account |

### Reports

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| GET | `/reports/trial-balance` | `from`, `to` | Trial balance |
| GET | `/reports/balance-sheet` | `asOf` | Balance sheet |
| GET | `/reports/income-statement` | `from`, `to` | Income statement (P&L) |
| GET | `/reports/vat` | `from`, `to` | VAT report |

### Tenant

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/tenants/register` | Public | Register new tenant |
| GET | `/tenant/profile` | Any | Get company profile |
| PUT | `/tenant/profile` | OWNER/ADMIN | Update company profile |

### ZATCA

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/zatca/onboard` | OWNER | Generate CSR + onboard with ZATCA |
| POST | `/zatca/certificate` | OWNER | Store ZATCA compliance certificate |
| GET | `/zatca/status` | Any | ZATCA onboarding status |

---

## Multitenancy

The system uses **schema-per-tenant** isolation:

- The `public` schema holds shared infrastructure (`tenants` table only)
- Each tenant gets a dedicated schema named `tenant_<uuid>` (e.g. `tenant_7df71e42_...`)
- The tenant is resolved from the `X-Tenant-ID` HTTP header on every request
- Hibernate's multitenancy support routes all queries to the correct schema automatically
- No cross-tenant data leakage is possible at the database level

When a new tenant registers, `TenantProvisioningService` creates the schema and runs all Flyway tenant migrations (`V1`–`V4`) automatically.

---

## ZATCA Compliance

ZATCA (Zakat, Tax and Customs Authority) Phase 2 e-invoicing is fully implemented:

| Requirement | Implementation |
|---|---|
| UBL 2.1 XML | `ZatcaXmlService` generates compliant XML per invoice |
| Digital signature | `ZatcaSignatureService` signs with ECDSA (secp256k1) via BouncyCastle |
| Invoice hash | SHA-256 hash of canonical XML, stored on invoice |
| QR code | `ZatcaQrCodeService` encodes TLV fields per ZATCA spec, rendered as base64 |
| Clearance (standard) | `ZatcaApiClient.clearInvoice()` — submits to ZATCA clearance API |
| Reporting (simplified) | `ZatcaApiClient.reportInvoice()` — submits to ZATCA reporting API |
| Certificate onboarding | CSR generation, ZATCA sandbox/production API integration |

Invoice workflow: **DRAFT** → `confirm` → **CONFIRMED** (XML + signature + QR generated, submitted to ZATCA) → **CLEARED** or **REPORTED**

---

## Database Migrations

Flyway manages all schema changes. Migrations are split into two sets:

**Public schema** (`db/migration/public/`):
| File | Description |
|---|---|
| `V1__init_public_schema.sql` | `tenants` table, shared infrastructure |

**Tenant schema** (`db/migration/tenant/`):
| File | Description |
|---|---|
| `V1__init_users_and_accounts.sql` | `users`, `accounts` (chart of accounts) |
| `V2__init_journal.sql` | `journal_entries`, `journal_entry_lines` |
| `V3__init_invoices.sql` | `invoices`, `invoice_items` |
| `V4__fix_account_parents.sql` | Account hierarchy & `is_leaf` corrections |

Tenant migrations run automatically when a new tenant is provisioned.

---

## Financial Reports

All four reports are available in the UI and exportable to Excel via SheetJS:

| Report | Endpoint | Description |
|---|---|---|
| Trial Balance | `/reports/trial-balance` | All accounts with debit/credit totals for a period |
| Balance Sheet | `/reports/balance-sheet` | Assets, liabilities, and equity at a point in time |
| Income Statement | `/reports/income-statement` | Revenue and expenses for a period (P&L) |
| VAT Report | `/reports/vat` | Output VAT, input VAT, and net VAT payable for a period |

The frontend `ExportService` uses SheetJS to generate `.xlsx` files client-side with RTL sheet direction.
