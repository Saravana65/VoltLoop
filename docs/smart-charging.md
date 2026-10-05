# VoltLoop — Smart Charging Allocation Engine & QR Workflow Specification

This document details the mathematical models, algorithmic rules, architectural workflows, and database transaction designs implemented in **Phase 4** of **VoltLoop — Smart Campus EV Fleet & Energy Management System**.

---

## 1. Why Smart Charging Allocation is Needed

In traditional campus EV charging systems, drivers manually choose any available charging station bay. This arbitrary selection leads to severe inefficiencies:
- **Fast Charger Hogging**: An e-scooter or low-capacity vehicle plugs into a 50 kW or 60 kW DC Fast Charger, taking up high-voltage hardware that a campus shuttle bus or high-capacity delivery van desperately needs.
- **Queueing Without Urgency**: An EV arriving with 85% state-of-charge (SoC) occupies a bay ahead of an EV arriving with 10% SoC that cannot complete its route.
- **Connector Incompatibility Bottlenecks**: Drivers attempt to plug vehicles into incompatible ports or unsupported power topologies.
- **Reservation Schedule Collisions**: Unmanaged advance bookings result in double-booking conflicts on the same station bay.

**VoltLoop Smart Allocation** replaces ad-hoc manual bay selection with a deterministic, multi-factor decision engine that evaluates battery level, battery capacity, connector compatibility, station power rating, reservation schedules, and waiting time.

---

## 2. End-to-End Workflow Diagram

```
       [ Driver Scans QR Code on Physical EV ]
                         │
                         ▼
             GET /api/vehicles/qr/{qrIdentifier}
                         │
                         ▼
             [ EV Telemetry & State Identified ]
                         │
                         ▼
           POST /api/charging/recommend
                         │
                         ▼
   ┌───────────────────────────────────────────────┐
   │        Smart Allocation Decision Engine       │
   ├───────────────────────────────────────────────┤
   │ 1. Validate EV Status (Active & Not Charging) │
   │ 2. Evaluate State of Charge (Current Battery) │
   │ 3. Filter Hardware Compatibility (Connectors) │
   │ 4. Filter Station Availability (Online/Ready) │
   │ 5. Calculate Priority Score (Urgency + Wait)  │
   │ 6. Estimate Required Energy & Turnaround Time │
   │ 7. Select Station with Shortest Turnaround    │
   └───────────────────────┬───────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
[ Advance Reservation ]         [ Immediate Walk-Up Charge ]
POST /api/charging/reserve      POST /api/charging/start
             │                           │
             ▼                           ▼
[ Conflict Check (JDBC) ]       [ JDBC Transaction ]
- Overlap Detection Query       - setAutoCommit(false)
- Pure JDBC Transaction         - Insert charging_sessions (ACTIVE)
- Commit / Rollback             - Update vehicles -> 'CHARGING'
                                - Update stations -> 'OCCUPIED'
                                - conn.commit() / conn.rollback()
                                         │
                                         ▼
                                [ Charging In Progress ]
                                         │
                                         ▼
                              POST /api/charging/complete
                                         │
                                         ▼
                                [ JDBC Transaction ]
                                - setAutoCommit(false)
                                - Compute Energy: Cap * (Final - Init)/100
                                - Compute Cost: kWh * ratePerKWh
                                - Update session -> 'COMPLETED'
                                - Update vehicles -> 'ACTIVE', new battery
                                - Update stations -> 'AVAILABLE'
                                - conn.commit() / conn.rollback()
```

---

## 3. QR Identification Workflow

Every campus EV has a unique `qr_identifier` (e.g., `VL-EV-001`, `VL-EV-002`) stored in the `vehicles` table:

1. The driver scans the QR code using the client application.
2. The client calls:
   ```http
   GET /api/vehicles/qr/{qrIdentifier}
   ```
3. The backend executes a parameterized query using JDBC `PreparedStatement`:
   ```sql
   SELECT v.*, u.name AS owner_name, u.email AS owner_email 
   FROM vehicles v 
   JOIN users u ON v.user_id = u.user_id 
   WHERE v.qr_identifier = ?
   ```
4. Returns the EV registration, owner name, battery capacity (kWh), current battery SoC (%), and vehicle status.
5. If the vehicle is already marked `CHARGING`, the system disallows new charging sessions with an `HTTP 409 Conflict`.

---

## 4. Charging Priority Engine

The priority engine scores charging urgency using a deterministic, rule-based formula designed for transparent PBL viva explanation.

### Mathematical Formulation

$$\text{Priority Score} = \text{Battery Urgency Score} + \text{Waiting Score}$$

#### A. Battery Urgency Score
Battery state-of-charge directly dictates operational urgency:

| Current Battery Range | Urgency Level | Score Assigned | Rationale |
|---|---|---|---|
| **0.0% – 20.0%** | `VERY_HIGH` | **100** | Critical battery level; vehicle at risk of stranding. |
| **20.1% – 40.0%** | `HIGH` | **75** | Substantial depletion; urgent top-up required. |
| **40.1% – 70.0%** | `MEDIUM` | **50** | Moderate battery level; regular charging queue. |
| **70.1% – 100.0%** | `LOW` | **25** | High battery level; opportunistic charging. |

#### B. Waiting Score
To ensure fairness in campus queues:
$$\text{Waiting Score} = \min\left(50, \left\lfloor \frac{\text{Waiting Minutes}}{2} \right\rfloor \right)$$
*(Adds +1 point per 2 minutes waiting, capped at 50 bonus points).*

---

## 5. Station Selection & Connector Compatibility Logic

### Connector Compatibility Matrix
VoltLoop enforces strict hardware compatibility matching:

| Vehicle Class | Example Campus Models | Compatible Connectors | Incompatible Connectors |
|---|---|---|---|
| **2-Wheeler** | e-Scooters (`VL-EV-001`), e-Motorbikes (`VL-EV-005`) | `Type 2` (AC), `Standard 15A Socket` | `CCS2` (DC Fast) |
| **4-Wheeler** | Compact EVs (`VL-EV-002`), Sedan EVs (`VL-EV-003`), SUVs (`VL-EV-007`) | `CCS2` (DC Fast), `Type 2` (AC Level 2) | `Standard 15A Socket` |
| **Fleet Transit** | Campus Shuttle Bus (`VL-EV-004`), Delivery Vans (`VL-EV-008`) | `CCS2` (DC Fast High Power), `Type 2` | `Standard 15A Socket` |
| **Utility Cart** | Maintenance Cart (`VL-EV-006`) | `Standard 15A Socket`, `Type 2` | `CCS2` |

### Station Ranking Algorithm
Among eligible stations:
1. Filter out stations with status $\neq$ `AVAILABLE`.
2. Filter out stations with active charging sessions (`charging_sessions.status = 'ACTIVE'`).
3. Filter out stations incompatible with the vehicle connector.
4. Calculate estimated turnaround time for each candidate station.
5. **Selection**: Recommend the station with the **shortest estimated turnaround time** (highest usable charging power).

---

## 6. Charging Time & Energy Estimation

### Energy Required Formula
$$\text{Required Energy (kWh)} = \text{Battery Capacity (kWh)} \times \frac{\max(0, \text{Target Battery \%} - \text{Current Battery \%})}{100}$$

*Default target battery is set to 80.0% (standard fast-charging cutoff point to protect battery longevity).*

### Turnaround Duration Formula
$$\text{Estimated Time (Hours)} = \frac{\text{Required Energy (kWh)}}{\text{Station Power Rating (kW)}}$$
$$\text{Estimated Time (Minutes)} = \text{Estimated Time (Hours)} \times 60$$

> [!NOTE]
> This formula assumes linear power delivery. In real-world battery management systems (BMS), charging curves taper in the constant-voltage (CV) phase above 80% to protect lithium-ion cell chemistry.

---

## 7. Reservation Conflict Detection

To prevent overlapping slot bookings on the same charging bay:

### Overlap Condition (Interval Collision Theory)
Two time intervals $[S_1, E_1]$ and $[S_2, E_2]$ on the same station overlap if and only if:
$$(S_1 < E_2) \quad \text{AND} \quad (E_1 > S_2)$$

### PreparedStatement Execution
```sql
SELECT r.*, v.registration_no, cs.station_name 
FROM charging_reservations r 
JOIN vehicles v ON r.vehicle_id = v.vehicle_id 
JOIN charging_stations cs ON r.station_id = cs.station_id 
WHERE r.station_id = ? 
  AND r.status IN ('RESERVED', 'ACTIVE') 
  AND r.start_time < ? 
  AND r.end_time > ?
```
If this query returns $\ge 1$ matching rows, the booking is rejected immediately with an **`HTTP 409 Conflict`**.

---

## 8. JDBC Transaction Safety (`ACID`)

VoltLoop uses explicit, low-level JDBC transaction control to guarantee atomic state transitions:

```java
try (Connection conn = dataSource.getConnection()) {
    // 1. Disable Auto-Commit: Marks the start of a manual JDBC transaction boundary
    conn.setAutoCommit(false);
    try {
        // Step A: Insert record into charging_sessions
        psSession.executeUpdate();

        // Step B: Update vehicles.status = 'CHARGING'
        psVehicle.executeUpdate();

        // Step C: Update charging_stations.status = 'OCCUPIED'
        psStation.executeUpdate();

        // 2. Commit Transaction: Persists all three changes atomically
        conn.commit();
    } catch (Exception ex) {
        // 3. Rollback: Reverts all uncommitted mutations if any statement fails
        conn.rollback();
        throw ex;
    }
}
```

### Viva Explanation: Why JDBC Transactions Matter
- **Atomicity**: Either all 3 tables (`charging_sessions`, `vehicles`, `charging_stations`) are updated together, or none are.
- **Consistency**: Prevents orphaned states where a station is marked `OCCUPIED` but no active session was created, or where an EV is marked `CHARGING` but the station remains `AVAILABLE`.
- **Isolation**: Concurrent database transactions cannot read intermediate, uncommitted states.
- **Durability**: Once `conn.commit()` succeeds, the changes survive system restarts.

---

## 9. Configurable Charging Cost Model

Charging cost is computed on session completion using a configurable electricity rate:

$$\text{Energy Consumed (kWh)} = \text{Battery Capacity (kWh)} \times \frac{\max(0, \text{Final Battery \%} - \text{Initial Battery \%})}{100}$$
$$\text{Total Cost} = \text{Energy Consumed (kWh)} \times \text{Rate per kWh}$$

### Configuration in `application.properties`:
```properties
charging.rate-per-kwh=${CHARGING_RATE_PER_KWH:15.00}
```
*The default flat campus rate is ₹15.00 per kWh, easily overridden by setting the `CHARGING_RATE_PER_KWH` environment variable.*
