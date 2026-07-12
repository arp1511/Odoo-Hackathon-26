# TransitOps — Backend Route Testing Guide

**Purpose:** Verify every route in `context.md` actually works, actually enforces the correct role, and actually applies the business rules — not just that it returns 200. Run this after routes are built and tables are populated with seed data.

**How to use this file:** Each test gives an exact `curl` command, the expected status code, and what to check in the response. Replace `{{TOKEN}}` with a real JWT and `{{ID}}` placeholders with real UUIDs from your seeded data. Run role-based tests with tokens from **different** logged-in users — testing with only one Fleet Manager token the whole time will hide access-leak bugs.

**Base URL:** `http://localhost:8080` (adjust if deployed)

---

## 0. Before you start — seed data checklist

You need at least this much data in the DB before these tests are meaningful:
- 1 user per role: `FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`
- 3+ vehicles: at least one `AVAILABLE`, one `IN_SHOP`, one `RETIRED`
- 3+ drivers: at least one `AVAILABLE` with valid license, one `SUSPENDED`, one with `license_expiry` in the past
- 1 vehicle with a low `max_load_capacity_kg` (e.g. 100kg) to test the cargo-overflow rule
- Get 4 JWTs, one per role, and store them as env vars before testing:

```bash
export FM_TOKEN="..."     # FLEET_MANAGER
export DISP_TOKEN="..."   # DISPATCHER
export SO_TOKEN="..."     # SAFETY_OFFICER
export FA_TOKEN="..."     # FINANCIAL_ANALYST
```

---

## 1. Auth & RBAC (Person A)

### 1.1 Register a new user
```bash
curl -i -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test1@x.com","password":"Password123!","role":"DISPATCHER"}'
```
**Expect:** `201 Created`. Response has no `password_hash` field. Check DB: `status` defaults to `ACTIVE`.

### 1.2 Register with duplicate email
Run 1.1 again with the same email.
**Expect:** `409 Conflict`, not a raw 500 stack trace.

### 1.3 Register with invalid role
```bash
curl -i -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bad Role","email":"bad@x.com","password":"Password123!","role":"SUPERADMIN"}'
```
**Expect:** `400 Bad Request` — the CHECK constraint or validation layer should reject this, not silently insert garbage.

### 1.4 Login with correct credentials
```bash
curl -i -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@x.com","password":"Password123!"}'
```
**Expect:** `200 OK`, response contains a JWT. Decode it (jwt.io) and confirm it has `role` and `sub` (user id) claims.

### 1.5 Login with wrong password
**Expect:** `401 Unauthorized`. Error message must NOT reveal whether the email exists or the password was wrong specifically — just "invalid credentials".

### 1.6 GET /api/auth/me with valid token
```bash
curl -i http://localhost:8080/api/auth/me -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `200 OK`, correct user info, no password_hash.

### 1.7 GET /api/auth/me with no token
```bash
curl -i http://localhost:8080/api/auth/me
```
**Expect:** `401 Unauthorized`.

### 1.8 GET /api/auth/me with garbage/expired token
```bash
curl -i http://localhost:8080/api/auth/me -H "Authorization: Bearer garbage.token.here"
```
**Expect:** `401 Unauthorized`, not a 500.

### 1.9 Dashboard KPIs — accessible to all roles
```bash
curl -i http://localhost:8080/api/dashboard/kpis -H "Authorization: Bearer $FA_TOKEN"
curl -i http://localhost:8080/api/dashboard/kpis -H "Authorization: Bearer $SO_TOKEN"
```
**Expect:** `200 OK` for both. Response has all 7 fields: `activeVehicles`, `availableVehicles`, `vehiclesInMaintenance`, `activeTrips`, `pendingTrips`, `driversOnDuty`, `fleetUtilizationPercent`. Sanity-check numbers match what's actually in the DB (e.g. `availableVehicles` should equal `SELECT COUNT(*) FROM vehicles WHERE status='AVAILABLE'`).

### 1.10 Dashboard filters
```bash
curl -i "http://localhost:8080/api/dashboard/kpis?type=Truck&region=Mumbai" -H "Authorization: Bearer $FM_TOKEN"
```
**Expect:** `200 OK`, numbers change to reflect the filter (test against a known filtered count).

---

## 2. Vehicles (Person B)

### 2.1 List vehicles — any role
```bash
curl -i http://localhost:8080/api/vehicles -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `200 OK`, paginated array.

### 2.2 Get vehicle detail with history
```bash
curl -i http://localhost:8080/api/vehicles/{{VEHICLE_ID}} -H "Authorization: Bearer $FM_TOKEN"
```
**Expect:** `200 OK`, includes linked trip/maintenance/fuel history, not just the bare row.

### 2.3 Create vehicle as FLEET_MANAGER
```bash
curl -i -X POST http://localhost:8080/api/vehicles \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"registrationNumber":"MH-01-TEST-01","name":"Test Van","type":"Van","maxLoadCapacityKg":500,"odometerKm":0,"acquisitionCost":800000,"region":"Mumbai"}'
```
**Expect:** `201 Created`, `status` in response is `AVAILABLE` automatically (you didn't send it).

### 2.4 Create vehicle as DISPATCHER — access leak check
```bash
curl -i -X POST http://localhost:8080/api/vehicles \
  -H "Authorization: Bearer $DISP_TOKEN" -H "Content-Type: application/json" \
  -d '{"registrationNumber":"MH-01-TEST-02","name":"Leak Test","type":"Van","maxLoadCapacityKg":500,"odometerKm":0,"acquisitionCost":800000}'
```
**Expect:** `403 Forbidden`. **This is the single most important test in this whole file — if it returns 201, you have a critical access-leak bug.**

### 2.5 Create vehicle with duplicate registration number
Run 2.3's payload again.
**Expect:** `409 Conflict` with a readable message like `"Registration number already exists"` — not a raw constraint-violation stack trace.

### 2.6 Try to change registration_number on an existing vehicle
```bash
curl -i -X PUT http://localhost:8080/api/vehicles/{{VEHICLE_ID}} \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"registrationNumber":"CHANGED-001","name":"Test Van","type":"Van","maxLoadCapacityKg":500,"odometerKm":0,"acquisitionCost":800000}'
```
**Expect:** `400 Bad Request` or the field is silently ignored and the original registration number is kept — either is fine, but silently accepting the change is a bug.

### 2.7 Manual status override
```bash
curl -i -X PATCH http://localhost:8080/api/vehicles/{{VEHICLE_ID}}/status \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"RETIRED"}'
```
**Expect:** `200 OK`, status updated.

### 2.8 Set an invalid status value
```bash
curl -i -X PATCH http://localhost:8080/api/vehicles/{{VEHICLE_ID}}/status \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"FLYING"}'
```
**Expect:** `400 Bad Request`.

### 2.9 GET /api/vehicles/available — the critical filter
```bash
curl -i http://localhost:8080/api/vehicles/available -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `200 OK`. Response must contain **zero** vehicles with `status` = `IN_SHOP` or `RETIRED`. Manually cross-check against your seeded data — if you seeded one `IN_SHOP` and one `RETIRED` vehicle, confirm neither appears here.

### 2.10 GET /api/vehicles/available as unauthorized role
```bash
curl -i http://localhost:8080/api/vehicles/available -H "Authorization: Bearer $SO_TOKEN"
```
**Expect:** `403 Forbidden` (only DISPATCHER and FLEET_MANAGER should have this).

---

## 3. Drivers (Person B)

### 3.1 List / get detail — any role
```bash
curl -i http://localhost:8080/api/drivers -H "Authorization: Bearer $FA_TOKEN"
```
**Expect:** `200 OK`.

### 3.2 Create driver as SAFETY_OFFICER
```bash
curl -i -X POST http://localhost:8080/api/drivers \
  -H "Authorization: Bearer $SO_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test Driver","licenseNumber":"TEST-LIC-001","licenseCategory":"LMV","licenseExpiry":"2027-01-01","contactNumber":"9999999999"}'
```
**Expect:** `201 Created`, `status` defaults to `AVAILABLE`.

### 3.3 Create driver as DISPATCHER — access leak check
```bash
curl -i -X POST http://localhost:8080/api/drivers \
  -H "Authorization: Bearer $DISP_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Leak Test","licenseNumber":"LEAK-001","licenseCategory":"LMV","licenseExpiry":"2027-01-01","contactNumber":"8888888888"}'
```
**Expect:** `403 Forbidden`.

### 3.4 Duplicate license number
Run 3.2's payload again.
**Expect:** `409 Conflict`.

### 3.5 Suspend a driver
```bash
curl -i -X PATCH http://localhost:8080/api/drivers/{{DRIVER_ID}}/status \
  -H "Authorization: Bearer $SO_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"SUSPENDED"}'
```
**Expect:** `200 OK`.

### 3.6 Suspend as FLEET_MANAGER — access leak check
```bash
curl -i -X PATCH http://localhost:8080/api/drivers/{{DRIVER_ID}}/status \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"SUSPENDED"}'
```
**Expect:** `403 Forbidden` — only SAFETY_OFFICER should be able to suspend/reinstate drivers per context.md.

### 3.7 GET /api/drivers/available — critical filter, two conditions
```bash
curl -i http://localhost:8080/api/drivers/available -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `200 OK`. Response must exclude:
- Any driver with `status != AVAILABLE` (confirm your suspended test driver from 3.5 is absent)
- Any driver with `license_expiry <= today` (confirm your seeded expired-license driver is absent)

### 3.8 GET /api/drivers/expiring-licenses
```bash
curl -i "http://localhost:8080/api/drivers/expiring-licenses?days=30" -H "Authorization: Bearer $SO_TOKEN"
```
**Expect:** `200 OK`, only drivers with `license_expiry` between today and today+30 days. Test with a driver whose license expires in 15 days (should appear) and one expiring in 90 days (should not).

### 3.9 GET /api/drivers/expiring-licenses as wrong role
```bash
curl -i "http://localhost:8080/api/drivers/expiring-licenses?days=30" -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `403 Forbidden`.

---

## 4. Trips & Dispatch (Person C) — the highest-risk module, test thoroughly

### 4.1 Create a Draft trip
```bash
curl -i -X POST http://localhost:8080/api/trips \
  -H "Authorization: Bearer $DISP_TOKEN" -H "Content-Type: application/json" \
  -d '{"source":"Andheri","destination":"Pune","vehicleId":"{{AVAILABLE_VEHICLE_ID}}","driverId":"{{AVAILABLE_DRIVER_ID}}","cargoWeightKg":300,"plannedDistanceKm":150}'
```
**Expect:** `201 Created`, `status: "DRAFT"`. **Critically:** re-check the vehicle and driver rows in DB — their `status` must still be `AVAILABLE`, unchanged. A Draft must not touch vehicle/driver state.

### 4.2 Create trip as FLEET_MANAGER — access leak check
Same payload as 4.1 but with `$FM_TOKEN`.
**Expect:** `403 Forbidden` — only DISPATCHER creates trips.

### 4.3 Dispatch — happy path
```bash
curl -i -X POST http://localhost:8080/api/trips/{{TRIP_ID}}/dispatch -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `200 OK`, trip `status: "DISPATCHED"`, `dispatchedAt` is set. **Then separately verify:**
```bash
curl -i http://localhost:8080/api/vehicles/{{VEHICLE_ID}} -H "Authorization: Bearer $DISP_TOKEN"
curl -i http://localhost:8080/api/drivers/{{DRIVER_ID}} -H "Authorization: Bearer $DISP_TOKEN"
```
Both must now show `status: "ON_TRIP"`. If either is still `AVAILABLE`, the transaction is broken.

### 4.4 Dispatch a trip whose vehicle is already ON_TRIP (double-dispatch)
Create a second Draft trip using the **same vehicle** from 4.3 (now ON_TRIP), then try to dispatch it.
**Expect:** `409 Conflict`, message about vehicle no longer available. Vehicle/driver status must NOT change again.

### 4.5 Dispatch with cargo exceeding vehicle capacity
Create a Draft trip where `cargoWeightKg` > the vehicle's `maxLoadCapacityKg` (e.g. 600kg on a 500kg van), then dispatch.
**Expect:** `409 Conflict`, message mentions the overage amount (e.g. "exceeds capacity by 100kg"). Vehicle/driver status unchanged.

### 4.6 Dispatch with a suspended driver
Create a Draft trip using a driver you suspended in test 3.5, then dispatch.
**Expect:** `409 Conflict`, "Driver no longer available".

### 4.7 Dispatch with an expired-license driver
Create a Draft trip using your seeded expired-license driver (bypass the `/available` filter by hardcoding the ID), then dispatch.
**Expect:** `409 Conflict`, "Driver's license has expired". **This test is important because it proves server-side re-validation, not just UI filtering** — the whole point of the rule.

### 4.8 Complete a dispatched trip
```bash
curl -i -X POST http://localhost:8080/api/trips/{{TRIP_ID}}/complete \
  -H "Authorization: Bearer $DISP_TOKEN" -H "Content-Type: application/json" \
  -d '{"actualDistanceKm":152,"fuelConsumedL":18}'
```
**Expect:** `200 OK`, trip `status: "COMPLETED"`, `completedAt` set. Verify vehicle and driver both revert to `status: "AVAILABLE"`.

### 4.9 Complete a trip that's still in DRAFT (invalid state transition)
```bash
curl -i -X POST http://localhost:8080/api/trips/{{DRAFT_TRIP_ID}}/complete \
  -H "Authorization: Bearer $DISP_TOKEN" -H "Content-Type: application/json" \
  -d '{"actualDistanceKm":100,"fuelConsumedL":10}'
```
**Expect:** `409 Conflict` — can't complete a trip that was never dispatched.

### 4.10 Cancel a dispatched trip
Dispatch a fresh trip, then:
```bash
curl -i -X POST http://localhost:8080/api/trips/{{TRIP_ID}}/cancel -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `200 OK`, trip `status: "CANCELLED"`, vehicle and driver both revert to `AVAILABLE`.

### 4.11 Cancel an already-completed trip
```bash
curl -i -X POST http://localhost:8080/api/trips/{{COMPLETED_TRIP_ID}}/cancel -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** `409 Conflict` — only `DISPATCHED` trips can be cancelled per context.md.

### 4.12 GET /api/trips/active
```bash
curl -i http://localhost:8080/api/trips/active -H "Authorization: Bearer $FM_TOKEN"
```
**Expect:** `200 OK`, only trips with `status: "DISPATCHED"` — confirm no DRAFT/COMPLETED/CANCELLED trips leak into this list.

### 4.13 Concurrency check — optimistic locking
Fetch a vehicle's current `version`. Try to dispatch two different Draft trips that both target this same `AVAILABLE` vehicle, firing the requests as close together as possible (two terminal tabs, near-simultaneous). **Expect:** exactly one succeeds with `200`, the other gets `409` (either from the business rule check or from a version-conflict exception) — never both succeeding and double-booking the vehicle.

---

## 5. Maintenance (Person D)

### 5.1 Create maintenance record — happy path
```bash
curl -i -X POST http://localhost:8080/api/maintenance \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"vehicleId":"{{AVAILABLE_VEHICLE_ID}}","description":"Oil change","cost":1500}'
```
**Expect:** `201 Created`, `status: "OPEN"`. **Then verify:**
```bash
curl -i http://localhost:8080/api/vehicles/{{VEHICLE_ID}} -H "Authorization: Bearer $FM_TOKEN"
```
Vehicle `status` must now be `"IN_SHOP"`. This must happen in the same request — if you have to call two separate endpoints to get this result, the transaction isn't atomic.

### 5.2 Create maintenance as DISPATCHER — access leak check
Same payload with `$DISP_TOKEN`.
**Expect:** `403 Forbidden`.

### 5.3 Confirm vehicle now excluded from dispatch pool
```bash
curl -i http://localhost:8080/api/vehicles/available -H "Authorization: Bearer $DISP_TOKEN"
```
**Expect:** the vehicle from 5.1 must NOT appear in this list anymore.

### 5.4 Close maintenance record
```bash
curl -i -X PATCH http://localhost:8080/api/maintenance/{{MAINT_ID}}/close -H "Authorization: Bearer $FM_TOKEN"
```
**Expect:** `200 OK`, `status: "CLOSED"`, `closedAt` set. Vehicle should revert to `AVAILABLE` — verify with a GET on the vehicle.

### 5.5 Close maintenance on a RETIRED vehicle — edge case
Manually set a vehicle to `RETIRED` while it has an open maintenance record (or retire it via 2.7 after creating maintenance on it), then close the maintenance record.
**Expect:** `200 OK`, maintenance closes, but vehicle status stays `RETIRED` — must NOT flip back to `AVAILABLE`. This is explicitly called out in context.md; if it flips to Available, it's a bug.

### 5.6 List maintenance as unauthorized role
```bash
curl -i http://localhost:8080/api/maintenance -H "Authorization: Bearer $SO_TOKEN"
```
**Expect:** `403 Forbidden` (only FLEET_MANAGER and FINANCIAL_ANALYST have read access per context.md).

---

## 6. Fuel Logs & Expenses (Person D)

### 6.1 Create fuel log as FLEET_MANAGER
```bash
curl -i -X POST http://localhost:8080/api/fuel-logs \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"vehicleId":"{{VEHICLE_ID}}","liters":40,"cost":4500,"logDate":"2026-07-12"}'
```
**Expect:** `201 Created`.

### 6.2 Create fuel log as DISPATCHER — should be allowed
```bash
curl -i -X POST http://localhost:8080/api/fuel-logs \
  -H "Authorization: Bearer $DISP_TOKEN" -H "Content-Type: application/json" \
  -d '{"vehicleId":"{{VEHICLE_ID}}","tripId":"{{COMPLETED_TRIP_ID}}","liters":18,"cost":2000,"logDate":"2026-07-12"}'
```
**Expect:** `201 Created` — DISPATCHER is explicitly allowed here per context.md (post-trip fuel logging).

### 6.3 Create fuel log as SAFETY_OFFICER — access leak check
**Expect:** `403 Forbidden`.

### 6.4 Create expense
```bash
curl -i -X POST http://localhost:8080/api/expenses \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"vehicleId":"{{VEHICLE_ID}}","category":"TOLL","amount":250,"expenseDate":"2026-07-12"}'
```
**Expect:** `201 Created`.

### 6.5 Create expense with invalid category
```bash
curl -i -X POST http://localhost:8080/api/expenses \
  -H "Authorization: Bearer $FM_TOKEN" -H "Content-Type: application/json" \
  -d '{"vehicleId":"{{VEHICLE_ID}}","category":"BRIBE","amount":250,"expenseDate":"2026-07-12"}'
```
**Expect:** `400 Bad Request` — CHECK constraint only allows `TOLL`, `MAINTENANCE`, `OTHER`.

### 6.6 Create expense as DISPATCHER — access leak check
**Expect:** `403 Forbidden` — only FLEET_MANAGER creates expenses per context.md.

---

## 7. Reports & CSV Export (Person D)

Run these only after tests 4–6 have generated enough real trip/fuel/maintenance data to compute against.

### 7.1 Fuel efficiency report
```bash
curl -i http://localhost:8080/api/reports/fuel-efficiency -H "Authorization: Bearer $FA_TOKEN"
```
**Expect:** `200 OK`, per-vehicle `distance/fuel` numbers. Spot-check one vehicle's number by hand: `actual_distance_km / fuel_consumed_l` from its completed trips.

### 7.2 Fleet utilization report
```bash
curl -i http://localhost:8080/api/reports/fleet-utilization -H "Authorization: Bearer $FA_TOKEN"
```
**Expect:** `200 OK`, a percentage that increases when you dispatch more trips (test before/after a fresh dispatch).

### 7.3 Operational cost report
```bash
curl -i http://localhost:8080/api/reports/operational-cost -H "Authorization: Bearer $FA_TOKEN"
```
**Expect:** `200 OK`. Spot-check: pick one vehicle, manually sum its `maintenance_logs.cost` + `fuel_logs.cost`, confirm it matches the report.

### 7.4 Vehicle ROI report
```bash
curl -i http://localhost:8080/api/reports/vehicle-roi -H "Authorization: Bearer $FA_TOKEN"
```
**Expect:** `200 OK`. **Before trusting this test, confirm the team resolved the `revenue` field question from context.md** — if `revenue` is always 0 because it was never wired into the trip-creation form, this report will return all-negative ROI, which is a data problem, not necessarily a bug, but worth flagging.

### 7.5 Reports as unauthorized role
```bash
curl -i http://localhost:8080/api/reports/vehicle-roi -H "Authorization: Bearer $DISP_TOKEN"
curl -i http://localhost:8080/api/reports/fuel-efficiency -H "Authorization: Bearer $SO_TOKEN"
```
**Expect:** `403 Forbidden` on both.

### 7.6 CSV export
```bash
curl -i "http://localhost:8080/api/reports/export/csv?type=fuel-efficiency" -H "Authorization: Bearer $FA_TOKEN" -o test-export.csv
```
**Expect:** `200 OK`, `Content-Type: text/csv`, file downloads and opens with correct headers/rows matching the JSON report from 7.1.

---

## 8. Cross-cutting checks (do these last, after everything above passes)

### 8.1 Full access-leak sweep
For every `POST`/`PUT`/`PATCH`/`DELETE` route in `context.md`, fire it once with each of the 3 tokens that are **not** supposed to have access. Build a simple table as you go:

| Route | Allowed Role(s) | Tested with wrong role → 403? |
|---|---|---|
| POST /api/vehicles | FLEET_MANAGER | ☐ DISP ☐ SO ☐ FA |
| POST /api/drivers | FLEET_MANAGER, SAFETY_OFFICER | ☐ DISP ☐ FA |
| PATCH /api/drivers/{id}/status | SAFETY_OFFICER | ☐ FM ☐ DISP ☐ FA |
| POST /api/trips | DISPATCHER | ☐ FM ☐ SO ☐ FA |
| POST /api/trips/{id}/dispatch | DISPATCHER | ☐ FM ☐ SO ☐ FA |
| POST /api/maintenance | FLEET_MANAGER | ☐ DISP ☐ SO ☐ FA |
| POST /api/fuel-logs | FLEET_MANAGER, DISPATCHER | ☐ SO ☐ FA |
| POST /api/expenses | FLEET_MANAGER | ☐ DISP ☐ SO ☐ FA |
| GET /api/reports/* | FINANCIAL_ANALYST (+FM for some) | ☐ DISP ☐ SO |

Fill this in for every row as you test — any unchecked box by the end means an untested access path.

### 8.2 No-token sweep
Fire every GET route with no `Authorization` header at all.
**Expect:** `401 Unauthorized` across the board — nothing should be publicly readable except `/api/auth/register` and `/api/auth/login`.

### 8.3 Cross-role read consistency
Log in as all 4 roles and hit `GET /api/vehicles`, `GET /api/drivers`, `GET /api/trips` with each. Per context.md these are "any authenticated" — confirm all 4 return `200` with the same data (not role-filtered subsets, unless that was an intentional decision your team made and documented).

### 8.4 Transaction atomicity spot-check
Pick any one of the atomic operations (dispatch, complete, cancel, maintenance create, maintenance close) and manually kill the DB connection or throw an exception mid-request if you can (e.g. temporarily break a downstream save). Confirm that on failure, **nothing** partially committed — e.g. a failed dispatch should leave the vehicle still `AVAILABLE`, not stuck at `ON_TRIP` with no matching dispatched trip.

---

## 9. Sign-off checklist

Before demo/judging, confirm:
- [ ] Every route in context.md has been fired at least once
- [ ] Every mutating route has been fired with at least one wrong-role token and returned 403
- [ ] The double-dispatch test (4.4) correctly rejects
- [ ] The cargo-overflow test (4.5) correctly rejects with the right message
- [ ] The expired-license test (4.7) correctly rejects
- [ ] Maintenance atomically flips vehicle to IN_SHOP (5.1) and back (5.4), respecting the RETIRED edge case (5.5)
- [ ] All 4 reports return numbers that match manual spot-checks against the DB
- [ ] CSV export actually downloads a valid, readable file
- [ ] No route returns a raw stack trace / 500 for a client-side validation error — those should all be 400/404/409
