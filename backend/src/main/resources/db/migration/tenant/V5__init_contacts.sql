CREATE TABLE contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar     VARCHAR(200) NOT NULL,
    name_en     VARCHAR(200),
    contact_type VARCHAR(20) NOT NULL,
    vat_number  VARCHAR(20),
    cr_number   VARCHAR(20),
    phone       VARCHAR(30),
    email       VARCHAR(150),
    address     VARCHAR(500),
    notes       VARCHAR(1000),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    created_by  UUID,
    updated_by  UUID
);

CREATE INDEX idx_contacts_type   ON contacts(contact_type);
CREATE INDEX idx_contacts_active ON contacts(active);
