-- V1__users_and_auth.sql — OWNER: Person A
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(30) NOT NULL
        CHECK (role IN ('FLEET_MANAGER','DISPATCHER','SAFETY_OFFICER','FINANCIAL_ANALYST')),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
