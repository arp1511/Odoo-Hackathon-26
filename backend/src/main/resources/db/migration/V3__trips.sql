-- V3__trips.sql — OWNER: Person C
CREATE TABLE trips (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source               VARCHAR(150) NOT NULL,
    destination          VARCHAR(150) NOT NULL,
    vehicle_id           UUID NOT NULL REFERENCES vehicles(id),
    driver_id            UUID NOT NULL REFERENCES drivers(id),
    cargo_weight_kg      NUMERIC(10,2) NOT NULL CHECK (cargo_weight_kg > 0),
    planned_distance_km  NUMERIC(10,2) NOT NULL CHECK (planned_distance_km > 0),
    actual_distance_km   NUMERIC(10,2),
    fuel_consumed_l      NUMERIC(10,2),
    revenue              NUMERIC(12,2) DEFAULT 0,  -- see NOTE below
    status               VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','DISPATCHED','COMPLETED','CANCELLED')),
    created_by           UUID NOT NULL REFERENCES users(id),
    dispatched_at        TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
