-- V2__vehicles_and_drivers.sql — OWNER: Person B
CREATE TABLE vehicles (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number  VARCHAR(30) NOT NULL UNIQUE,
    name                 VARCHAR(120) NOT NULL,
    type                 VARCHAR(50) NOT NULL,
    max_load_capacity_kg NUMERIC(10,2) NOT NULL CHECK (max_load_capacity_kg > 0),
    odometer_km          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),
    acquisition_cost     NUMERIC(12,2) NOT NULL CHECK (acquisition_cost >= 0),
    status               VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE','ON_TRIP','IN_SHOP','RETIRED')),
    region               VARCHAR(80),
    version              BIGINT NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE drivers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    name              VARCHAR(120) NOT NULL,
    license_number    VARCHAR(50) NOT NULL UNIQUE,
    license_category  VARCHAR(20) NOT NULL,
    license_expiry    DATE NOT NULL,
    contact_number    VARCHAR(20) NOT NULL,
    safety_score      NUMERIC(4,1) NOT NULL DEFAULT 100.0
        CHECK (safety_score BETWEEN 0 AND 100),
    status            VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE','ON_TRIP','OFF_DUTY','SUSPENDED')),
    version           BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
