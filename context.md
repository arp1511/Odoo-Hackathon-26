# TransitOps — Project Context

**Purpose of this file:** This is the single source of truth for the TransitOps hackathon build. Every AI coding assistant (Antigravity, Claude, Copilot, etc.) working on any part of this codebase should read this file first. It defines exact routes, exact table schemas, exact business rules, and exact ownership boundaries so no one's module conflicts with anyone else's or gets hallucinated differently by different tools.

**Stack:** Spring Boot 3.x, Java 17+, PostgreSQL (single shared cloud instance), Flyway migrations, Spring Security + JWT, Lombok, springdoc-openapi, opencsv.

**Team size:** 4 people, one shared Postgres DB, one shared repo. Nobody runs a local DB — everyone points at the same cloud instance via `.env`.

---

## 0. Global Rules (apply to every module, every person)

1. **Never use `ddl-auto: update`.** Schema changes only happen through Flyway migration files (`V1__..sql`, `V2__..sql`, etc.), one file per person's module. `application.yml` must have `spring.jpa.hibernate.ddl-auto: validate`.
2. **Every mutating endpoint has `@PreAuthorize`.** No endpoint relies on the frontend hiding a button. If a role isn't listed as allowed in the route table below, that role must get a 403.
3. **Every multi-table state change is `@Transactional`.** Dispatching a trip, closing maintenance, etc. touch 2+ tables and must never leave the DB half-updated.
4. **Server-side validation always re-checks fresh DB state.** Never trust a value the frontend already showed as valid — another user may have changed it a second ago. This is why `vehicles` and `drivers` have `@Version` columns (optimistic locking).
5. **Roles (exactly 4, spelled exactly like this in code and DB):**
   - `FLEET_MANAGER`
   - `DISPATCHER` *(this is the role the original problem statement calls "Driver" — it means the person who creates/assigns trips, NOT the person physically driving. Physical drivers live in the `drivers` table and do not log in as a role.)*
   - `SAFETY_OFFICER`
   - `FINANCIAL_ANALYST`
5. All primary keys are `UUID DEFAULT gen_random_uuid()`. All tables have `created_at TIMESTAMPTZ DEFAULT now()` unless noted.
6. All money fields are `NUMERIC`, never `FLOAT`/`DOUBLE`.
7. Status fields are `VARCHAR` with a `CHECK` constraint listing the exact allowed values — never a free-text status column.

---

## 1. Full Database Schema (reference for everyone — each person only writes their own migration file, but must not contradict this)

```sql
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
```

```sql
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
```

```sql
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
```
> **NOTE — unresolved spec gap:** `revenue` is needed for the Vehicle ROI report (`(Revenue - (Maintenance + Fuel)) / Acquisition Cost`) but the original problem statement never defines where Revenue comes from. Decided approach: manual `revenue` field entered at trip creation (e.g. a flat rate the dispatcher enters, or `rate_per_km × planned_distance_km`). **Confirm this with the team before Person D builds the ROI endpoint** — if this changes, it only affects Person C's trip form and Person D's report query, nobody else.

```sql
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
```

**7 tables total. No one adds a table outside this list without updating this file and telling the team.**

---

## 2. PERSON A — Auth, RBAC, Dashboard, Infra

### Owns
- `V1__users_and_auth.sql`
- All Spring Security / JWT configuration
- Dashboard aggregation endpoint
- Shared cloud Postgres provisioning + `.env` distribution

### Exact routes

| Method | Route | Access | Behavior |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create user, hash password with BCrypt, default status ACTIVE |
| POST | `/api/auth/login` | Public | Verify credentials, issue JWT with `sub`=userId and `role` claim |
| GET | `/api/auth/me` | Any authenticated | Return current user from token, no password_hash in response |
| GET | `/api/dashboard/kpis` | Any authenticated | Returns: activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilizationPercent. Accepts optional query params `type`, `status`, `region` to filter |

### Exact DB table
`users` (see schema above — Person A owns this migration file exclusively)

### Build order note
`@EnableMethodSecurity` + the JWT filter chain must be done **first**, before hour 2, because every other person's `@PreAuthorize` annotations require it to compile and actually enforce.

### Explicit non-goals for this module
Person A does NOT build vehicle/driver/trip logic. Dashboard queries read from `vehicles`, `drivers`, `trips` tables (owned by B and C) via read-only JPA queries — no writes.

---

## 3. PERSON B — Vehicles & Drivers

### Owns
- `V2__vehicles_and_drivers.sql`
- `Vehicle` entity, `Driver` entity (both with `@Version` field)
- All vehicle and driver CRUD

### Exact routes

| Method | Route | Access | Behavior |
|---|---|---|---|
| GET | `/api/vehicles` | Any authenticated | Paginated list |
| GET | `/api/vehicles/{id}` | Any authenticated | Detail + linked trip/maintenance/fuel history (read joins into trips, maintenance_logs, fuel_logs) |
| POST | `/api/vehicles` | `FLEET_MANAGER` | Validate `registration_number` uniqueness at service layer with a clean 409 error, not a raw DB exception. Status defaults to `AVAILABLE` |
| PUT | `/api/vehicles/{id}` | `FLEET_MANAGER` | Edit. `registration_number` is immutable after creation — reject any attempt to change it |
| PATCH | `/api/vehicles/{id}/status` | `FLEET_MANAGER` | Manual status override |
| DELETE | `/api/vehicles/{id}` | `FLEET_MANAGER` | Soft delete not required for hackathon scope — hard delete acceptable, or skip this route if time-constrained |
| GET | `/api/vehicles/available` | `DISPATCHER`, `FLEET_MANAGER` | **Query filters `status = 'AVAILABLE'` server-side.** This is what Person C's dispatch dropdown depends on — response shape must be `[{id, registrationNumber, name, maxLoadCapacityKg}]` exactly, confirm with Person C before changing |
| GET | `/api/drivers` | Any authenticated | Paginated list |
| GET | `/api/drivers/{id}` | Any authenticated | Detail |
| POST | `/api/drivers` | `FLEET_MANAGER`, `SAFETY_OFFICER` | Validate `license_number` uniqueness |
| PUT | `/api/drivers/{id}` | `FLEET_MANAGER`, `SAFETY_OFFICER` | Edit profile fields |
| PATCH | `/api/drivers/{id}/status` | `SAFETY_OFFICER` | Suspend/reinstate |
| GET | `/api/drivers/available` | `DISPATCHER` | **Filters `status = 'AVAILABLE' AND license_expiry > CURRENT_DATE`** server-side. Response shape: `[{id, name, licenseNumber, licenseCategory}]` |
| GET | `/api/drivers/expiring-licenses?days=30` | `SAFETY_OFFICER` | `license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + days`, sorted soonest-first |

### Exact DB tables
`vehicles`, `drivers` (see schema above)

### Explicit non-goals
Person B does NOT touch trip dispatch logic, does NOT flip vehicle/driver status to `ON_TRIP` — that mutation belongs entirely to Person C's `TripService`. Person B's `PATCH /status` route is for *manual* overrides only (e.g. retiring a vehicle), not automated transitions.

---

## 4. PERSON C — Trips & Dispatch (core business-rule engine)

### Owns
- `V3__trips.sql`
- `Trip` entity, `TripService`, `TripController`
- All dispatch/complete/cancel business logic — **the highest-risk module, start first, get the most time buffer**

### Exact routes

| Method | Route | Access | Behavior |
|---|---|---|---|
| GET | `/api/trips` | Any authenticated | Paginated, filterable by status |
| GET | `/api/trips/{id}` | Any authenticated | Detail |
| GET | `/api/trips/active` | Any authenticated | `status = 'DISPATCHED'` only |
| POST | `/api/trips` | `DISPATCHER` | Create trip as `DRAFT`. No vehicle/driver status change happens here — a Draft is just a proposal |
| POST | `/api/trips/{id}/dispatch` | `DISPATCHER` | **See exact validation sequence below** |
| POST | `/api/trips/{id}/complete` | `DISPATCHER` | Requires `actualDistanceKm`, `fuelConsumedL` in body |
| POST | `/api/trips/{id}/cancel` | `DISPATCHER` | Only allowed when `status = 'DISPATCHED'` |

### Exact dispatch validation sequence (`TripService.dispatch()`, `@Transactional`)
1. Re-fetch `vehicle` and `driver` fresh from DB by ID (never use values passed from the frontend)
2. `if (vehicle.status != AVAILABLE)` → throw 409, message: `"Vehicle no longer available"`
3. `if (driver.status != AVAILABLE)` → throw 409, message: `"Driver no longer available"`
4. `if (driver.licenseExpiry <= today)` → throw 409, message: `"Driver's license has expired"`
5. `if (trip.cargoWeightKg > vehicle.maxLoadCapacityKg)` → throw 409, message: `"Cargo exceeds vehicle capacity by Xkg"` (compute X)
6. If all pass, in the same transaction: `vehicle.status = ON_TRIP`, `driver.status = ON_TRIP`, `trip.status = DISPATCHED`, `trip.dispatchedAt = now()`. Save all three.

### Exact complete sequence
`vehicle.status = AVAILABLE`, `driver.status = AVAILABLE`, `trip.status = COMPLETED`, `trip.completedAt = now()`, save `actualDistanceKm` and `fuelConsumedL`.

### Exact cancel sequence
Only if `trip.status == DISPATCHED`: `vehicle.status = AVAILABLE`, `driver.status = AVAILABLE`, `trip.status = CANCELLED`.

### Exact DB table
`trips` (see schema above)

### Explicit non-goals
Person C does NOT build vehicle/driver CRUD (calls Person B's `/available` endpoints instead). Does NOT build fuel logging directly, but should trigger a frontend prompt to log fuel right after `complete` — that POST goes to Person D's `/api/fuel-logs` endpoint.

---

## 5. PERSON D — Maintenance, Fuel/Expenses, Reports

### Owns
- `V4__maintenance_fuel_expenses.sql`
- `MaintenanceLog`, `FuelLog`, `Expense` entities
- All reporting/analytics endpoints (build these last, after real data exists in trips/fuel/maintenance)

### Exact routes

| Method | Route | Access | Behavior |
|---|---|---|---|
| GET | `/api/maintenance` | `FLEET_MANAGER`, `FINANCIAL_ANALYST` | List, filterable by OPEN/CLOSED |
| POST | `/api/maintenance` | `FLEET_MANAGER` | `@Transactional`: insert maintenance row AND set `vehicle.status = IN_SHOP` atomically |
| PATCH | `/api/maintenance/{id}/close` | `FLEET_MANAGER` | Set `closed_at`, `status = CLOSED`. Restore `vehicle.status = AVAILABLE` **unless** vehicle's current status is `RETIRED` — check this explicitly, retired wins |
| GET | `/api/fuel-logs` | `FLEET_MANAGER`, `FINANCIAL_ANALYST` | List |
| POST | `/api/fuel-logs` | `FLEET_MANAGER`, `DISPATCHER` | Create. `trip_id` optional (nullable FK) |
| GET | `/api/expenses` | `FINANCIAL_ANALYST`, `FLEET_MANAGER` | List |
| POST | `/api/expenses` | `FLEET_MANAGER` | Create |
| GET | `/api/reports/fuel-efficiency` | `FINANCIAL_ANALYST`, `FLEET_MANAGER` | Per vehicle: `SUM(actual_distance_km) / SUM(fuel_consumed_l)` from completed trips |
| GET | `/api/reports/fleet-utilization` | `FINANCIAL_ANALYST`, `FLEET_MANAGER` | % of vehicles `ON_TRIP` or with trip-hours in a date range vs total fleet count |
| GET | `/api/reports/operational-cost` | `FINANCIAL_ANALYST` | Per vehicle: `SUM(maintenance_logs.cost) + SUM(fuel_logs.cost)` |
| GET | `/api/reports/vehicle-roi` | `FINANCIAL_ANALYST` | `(trips.revenue_sum - (maintenance_cost + fuel_cost)) / vehicle.acquisition_cost` — **depends on the `revenue` field decision, see NOTE in section 1** |
| GET | `/api/reports/export/csv?type=` | `FINANCIAL_ANALYST`, `FLEET_MANAGER` | Stream any of the above 4 reports as CSV via opencsv |

### Exact DB tables
`maintenance_logs`, `fuel_logs`, `expenses` (see schema above)

### Explicit non-goals
Person D does NOT touch `vehicles.status` outside the maintenance create/close transactional flip described above. Does NOT build the trip-dispatch logic — reports only *read* from `trips`, never write to it.

---

## 6. Build Order / Dependency Chain

1. **Hour 1:** Person A finishes JWT + `@EnableMethodSecurity` (blocks everyone's `@PreAuthorize`). B, C, D write Flyway migrations + entities in parallel (no cross-dependency yet).
2. **Hour 2–3:** Person B ships `/api/vehicles/available` and `/api/drivers/available` first, ahead of full CRUD polish — Person C is blocked on these for the dispatch dropdown.
3. **Hour 3–5:** Person C builds `TripService.dispatch()` — highest risk, most buffer time.
4. **Hour 4–6:** Person D builds maintenance + fuel/expense CRUD in parallel with C.
5. **Hour 6–7:** Person D builds reports once trip/fuel/maintenance data actually exists to query.
6. **Last hour:** Integration pass — every person tests hitting every *other* person's endpoints with the wrong role via Postman/curl to confirm 403s actually fire (not just hidden UI buttons).

---

## 7. Things every AI coding assistant must NOT invent

- Do not add new tables, new columns, or new roles beyond what's listed in Section 1 and the global rules without flagging it to the team first.
- Do not rename `DISPATCHER` back to `DRIVER` — the physical driver already has a table (`drivers`) and this would cause naming collisions in code and confusion in the DB.
- Do not use `ddl-auto: update` — schema owner is Flyway only.
- Do not let any status transition happen outside the exact sequences defined in Section 4 (dispatch/complete/cancel) and Section 5 (maintenance open/close).
- Do not resolve the `revenue` field ambiguity (Section 1 NOTE) unilaterally — confirm with the team, since it affects both Person C's trip form and Person D's ROI report.
