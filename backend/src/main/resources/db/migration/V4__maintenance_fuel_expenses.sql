-- V4__maintenance_fuel_expenses.sql — OWNER: Person D
CREATE TABLE maintenance_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id   UUID NOT NULL REFERENCES vehicles(id),
    description  VARCHAR(500) NOT NULL,
    cost         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    status       VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN','CLOSED')),
    created_by   UUID NOT NULL REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at    TIMESTAMPTZ
);

CREATE TABLE fuel_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id   UUID NOT NULL REFERENCES vehicles(id),
    trip_id      UUID REFERENCES trips(id),
    liters       NUMERIC(8,2) NOT NULL CHECK (liters > 0),
    cost         NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
    log_date     DATE NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id    UUID NOT NULL REFERENCES vehicles(id),
    category      VARCHAR(30) NOT NULL
        CHECK (category IN ('TOLL','MAINTENANCE','OTHER')),
    amount        NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    expense_date  DATE NOT NULL,
    description   VARCHAR(300),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
