# VoltLoop — Smart Campus EV Fleet & Energy Management System

A product-like, full-stack college Project-Based Learning (PBL) application designed to monitor, identify, allocate, and optimize electric vehicle charging and energy consumption across university campus infrastructure.

---

## 1. Problem Statement

With the rapid adoption of electric two-wheelers, faculty electric cars, and campus shuttle fleets, universities face significant charging infrastructure challenges:
- **Queueing & Slot Bottlenecks**: Drivers compete for charging bays without real-time station availability.
- **Physical Identification Delays**: Difficulty in verifying vehicle ownership, battery health, and eligibility at stations.
- **Energy Accounting Gaps**: Lack of visibility into real kilowatt-hour (kWh) power consumption and charging costs.
- **Double Booking Conflicts**: Unmanaged reservations leading to schedule collisions.

**VoltLoop** solves this through automated QR-based EV identification, intelligent reservation conflict checks, real-time station state synchronization, and energy consumption auditing.

---

## 2. Core Project Features

1. **EV Registration and Fleet Asset Management**: Stores vehicle profiles, battery capacities, and active states.
2. **QR-Based EV Identification**: Every registered EV possesses a unique `qr_identifier` (e.g. `VL-EV-001`). Scanning retrieves EV telemetry instantly.
3. **Charging Station Management**: Tracks station bays, charger types (AC Level 2, DC Fast), power ratings (kW), and connector standards (CCS2, Type 2).
4. **Charging Slot Conflict Detection**: Prevents overlapping reservations on the same bay via interval collision detection.
5. **Real-Time Charging Session Management**: Captures initial battery, dynamic charging states, and timestamps.
6. **Energy Consumption Tracking**: Calculates energy dispensed in kilowatt-hours (kWh) per session.
7. **Charging Cost Calculation**: Automatically reconciles billing based on kWh delivered (₹15.00/kWh).
8. **EV Usage History**: Auditing of charging logs per vehicle.
9. **Station Utilization Analytics**: Measures usage frequency and energy throughput across campus stations.
10. **Role-Based Users**: Administrator, Fleet Operator, and Driver stakeholders.
11. **Admin & Live Dashboard**: Real-time fleet and bay monitoring via responsive React frontend.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide React
- **Backend**: Java 17 + Spring Boot REST API
- **Database Connectivity**: Pure JDBC (`PreparedStatement`, `JdbcTemplate`, `HikariCP`)
- **Database**: MySQL 8.0 (Relational schema with primary/foreign keys, CHECK constraints, indexes)
- **Infrastructure**: Docker & Docker Compose
- **Version Control**: Git / GitHub

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────────┐
│               React.js Frontend (Vite)                │
│    (QR Scanner UI, Fleet Dashboard, Station Boards)    │
│    Runs on: http://localhost:5173                      │
└───────────────────────────┬────────────────────────────┘
                            │  HTTP / JSON REST API (Vite Proxy)
┌───────────────────────────▼────────────────────────────┐
│                  Java Backend Layer                    │
│    - Spring Boot 3.2 REST Controllers                  │
│    - Business Logic & Conflict Detection Services      │
│    - Transaction Management (@Transactional)           │
│    Runs on: http://localhost:8080                      │
└───────────────────────────┬────────────────────────────┘
                            │  Pure JDBC & PreparedStatement
┌───────────────────────────▼────────────────────────────┐
│                 JDBC Data Access Layer                 │
│    - JdbcTemplate / java.sql.Connection                │
│    - Parameterized SQL (SQL-Injection Protected)       │
│    - HikariCP High-Performance Connection Pool         │
└───────────────────────────┬────────────────────────────┘
                            │  TCP Connection (Port 3306)
┌───────────────────────────▼────────────────────────────┐
│                    MySQL 8.0 Engine                    │
│    - Database: voltloop                                │
│    - Primary Keys, Foreign Keys, CHECK Constraints     │
│    - B-tree Indexes (Fast QR & Slot Collision Lookups) │
└───────────────────────────┬────────────────────────────┘
                            │  Containerized Virtualization
┌───────────────────────────▼────────────────────────────┐
│                    Docker Container                    │
│    - Image: mysql:8.0                                  │
│    - Persistent Volume: voltloop_db_data               │
└────────────────────────────────────────────────────────┘
```

---

## 5. Development Phases & Current Status

- **PHASE 1 — COMPLETE**: Project scaffolding, Docker configuration, database schema, and architecture documentation.
- **PHASE 2 — COMPLETE**: Relational database, realistic seed dataset, CHECK constraints, and 15 analytical SQL queries.
- **PHASE 3 — COMPLETE**: Java Spring Boot backend, pure JDBC repositories, QR identification endpoint, session lifecycle, and unit test suite.
- **PHASE 4 — COMPLETE**: Rule-based smart charging allocation engine, multi-factor priority scoring, charger compatibility matrix, slot overlap conflict detection, and session energy/cost auditing.
- **PHASE 5 — COMPLETE**: React 18 + Vite frontend, responsive dark fleet dashboard, QR identification UI, interactive smart allocation engine, slot reservations with HTTP 409 conflict alerts, live charging session billing, fleet analytics charts, and centralized API service layer.
- **PHASE 6 — COMPLETE**: Full system integration audit, JDBC transaction rollback verification, 26-step automated demo workflow verification, edge case testing, and live prototype demonstration readiness.
- **PHASE 7 — COMPLETE**: QR-based charging station check-in & authorization workflow inspired by metro transit turnstiles. Client-side digital EV QR Pass with high-density 2D QR generation, dedicated station check-in terminal with camera scanner (`html5-qrcode`) and manual fallback, pure read-only authorization backend (`POST /api/charging/check-in`) verifying 7 business rules with zero premature database mutations, and explicit start charging action.
- **PHASE 8 — COMPLETE**: Retrospective Integration Audit, UI/UX Polish, Full System Validation & Live Demo Readiness. Redesigned frontend to a premium SaaS EV fleet dashboard using Tailwind CSS; resolved layout and sidebar clipping across all viewports; verified entire 12-step application lifecycle with 100% automated test pass (`validate_phase8.ps1`); confirmed zero-mutation check-in interlocks, mathematical interval collision blocking, and ACID transaction rollbacks; and created comprehensive examiner demonstration script.
- **PHASE 9 — COMPLETE**: Dual-Portal Architecture — Owner & Customer. Built customer registration with BCrypt password hashing, secure token service, dedicated Owner Portal (`/owner/*`) for station monitoring, hardware control, and verified revenue accounting (strictly counting `SUCCESSFUL` transactions), and Customer Portal (`/customer/*`) for station QR scanning, EV management, charging session control, simulated checkout (UPI, Card, Net Banking, Campus Wallet), official tax invoices / digital receipts with GSTIN, and strict role/data isolation. Verified with 14/14 automated tests (`validate_phase9.ps1`) and 11/11 retrospective audit tests (`audit_phase8_retrospective.ps1`).

---

## 6. Smart Charging Allocation Engine

VoltLoop incorporates an explainable, deterministic rule-based allocation engine designed for real-world campus EV fleets without opaque AI black-boxes.

### Core Mathematical Formulations:

1. **Energy Required Calculation**:
   $$\text{Energy Required (kWh)} = \text{Battery Capacity (kWh)} \times \frac{\max(0, \text{Target \%} - \text{Current \%})}{100}$$

2. **Charging Duration Estimation**:
   $$\text{Duration (minutes)} = \left\lceil \frac{\text{Energy Required (kWh)}}{\text{Station Power (kW)}} \times 60 \right\rceil$$

3. **Charging Cost Computation**:
   $$\text{Total Cost (₹)} = \text{Energy Consumed (kWh)} \times \text{Rate per kWh (₹15.00)}$$

4. **Multi-Factor Priority Scoring**:
   $$\text{Priority Score} = \text{Battery Urgency Score} + \min(\text{Waiting Minutes}, 50)$$
   - $\le 20\%$ Battery: **100 points** (`VERY_HIGH` urgency)
   - $21\% - 40\%$ Battery: **75 points** (`HIGH` urgency)
   - $41\% - 70\%$ Battery: **50 points** (`MEDIUM` urgency)
   - $71\% - 100\%$ Battery: **25 points** (`LOW` urgency)

5. **Reservation Interval Conflict Detection**:
   $$\text{Conflict} \iff (\text{newStart} < \text{existingEnd}) \land (\text{newEnd} > \text{existingStart})$$
   Overlaps immediately return `HTTP 409 Conflict`.

6. **ACID Transaction Control**:
   Charging session starts, completions, and slot reservations utilize atomic JDBC transaction management (`conn.setAutoCommit(false)`, `conn.commit()`, `conn.rollback()`) to guarantee state consistency across `vehicles`, `charging_stations`, and `charging_sessions`.

---

## 7. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | List all registered electric vehicles. |
| `GET` | `/api/vehicles/{id}` | Get vehicle details and battery specifications. |
| `GET` | `/api/vehicles/qr/{qrIdentifier}` | Look up EV by unique QR identifier (e.g. `VL-EV-001`). |
| `POST` | `/api/vehicles` | Register a new EV. |
| `PUT` | `/api/vehicles/{id}/battery` | Update current battery SoC. |
| `GET` | `/api/stations` | List all campus charging stations. |
| `GET` | `/api/stations/available` | List stations currently available. |
| `POST` | `/api/stations` | Add a new charging bay. |
| `PUT` | `/api/stations/{id}/status` | Update station status (`AVAILABLE`, `MAINTENANCE`). |
| `GET` | `/api/reservations` | List all slot reservations. |
| `POST` | `/api/charging/reserve` | Book a bay slot with interval conflict check (returns `409` on collision). |
| `PUT` | `/api/reservations/{id}/cancel` | Cancel an existing reservation. |
| `GET` | `/api/sessions` | List all charging sessions. |
| `GET` | `/api/sessions/active` | List currently active charging sessions. |
| `POST` | `/api/charging/check-in` | **Phase 7 Check-In Authorization**: Validate EV QR at station bay across 7 business rules (Pure read-only). |
| `POST` | `/api/charging/authorize-checkin` | Alias for check-in authorization. Supports `?evaluate=true` query parameter for soft 200 rejection inspection. |
| `POST` | `/api/charging/start` | Transactionally start charging session. |
| `POST` | `/api/charging/complete` | Complete session, calculate kWh & cost (₹), update battery, release bay. |
| `POST` | `/api/charging/recommend` | Rule-based smart station recommendation. |
| `GET` | `/api/analytics` | Aggregated fleet energy consumption, session duration, and station utilization. |
| `GET` | `/api/analytics/summary` | Summary KPIs for dashboard cards. |

---

## 8. QR-Based Charging Station Check-In & Authorization (Phase 7)

VoltLoop implements a metro transit turnstile-inspired check-in and authorization workflow.

```
+-------------------------------------------------------------+
| 1. User displays Digital EV QR Pass                         |
|    - Opaque identifier only (e.g. VL-EV-001)                |
|    - High-density 2D QR generated via qrcode library        |
+------------------------------+------------------------------+
                               | Scanned at bay terminal
+------------------------------v------------------------------+
| 2. Station Terminal (/station-checkin)                      |
|    - Camera scanner (html5-qrcode) or manual fallback       |
|    - Selects station bay                                    |
+------------------------------+------------------------------+
                               | POST /api/charging/check-in
+------------------------------v------------------------------+
| 3. Backend Read-Only Validation (7 Business Rules)          |
|    Rule 1: QR Identifier exists in database                 |
|    Rule 2: EV status is ACTIVE (not INACTIVE)               |
|    Rule 3: Charging station exists in database              |
|    Rule 4: Station is AVAILABLE (not MAINTENANCE)           |
|    Rule 5: Connector is compatible (Type 2, CCS2, 15A)      |
|    Rule 6: EV is not already charging elsewhere             |
|    Rule 7: Reservation window check (if reserved)           |
+------------------------------+------------------------------+
                               | Result returned (authorized: true/false)
+------------------------------v------------------------------+
| 4. Strict Non-Mutating Authorization                         |
|    - Scan ALONE NEVER starts a session or modifies DB       |
|    - EV remains ACTIVE, Station remains AVAILABLE           |
+------------------------------+------------------------------+
                               | User clicks "Plug In & Start Charging"
+------------------------------v------------------------------+
| 5. Explicit Session Activation (POST /api/charging/start)   |
|    - Atomic JDBC transaction: conn.setAutoCommit(false)     |
|    - Creates charging session, sets Station OCCUPIED,       |
|      sets EV CHARGING, executes conn.commit()               |
+-------------------------------------------------------------+
```

### Authorization vs Session Execution Separation:
- **Authorization (`POST /api/charging/check-in`)**: Completely read-only query execution across `vehicles`, `charging_stations`, and `reservations`. No records inserted or updated.
- **Execution (`POST /api/charging/start`)**: Explicit operator/user step executing ACID-compliant database transaction.

---

## 9. Running the Complete Application

### 1. Database (Docker or Native MySQL)
```bash
# Using Docker:
docker compose up -d

# Or verify native MySQL is running on localhost:3306
```

### 2. Java Spring Boot Backend
```bash
cd backend
mvn clean test
mvn spring-boot:run
```
Backend will boot at: **`http://localhost:8080`**

### 3. React Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be accessible at: **`http://localhost:5173`**

---

## 10. Phase 8 — UI/UX Polish, System Validation & Live Demo Guide

Phase 8 elevates VoltLoop from an engineering prototype to a production-grade, presentation-ready SaaS product suitable for high-stakes academic evaluations and industry portfolios.

### 1. UI/UX Design System Standard
- **Color Architecture**: Deep slate/charcoal backgrounds (`#0B0F19`, `#111827`, `#1F2937`) paired with high-contrast text (`#F9FAFB`) to minimize eye fatigue during operations monitoring.
- **Visual Semantics**:
  - **Emerald Green / Teal** (`#10B981` / `#14B8A6`): Normal operations, available stations, active EVs, granted check-in authorizations.
  - **Amber / Orange** (`#F59E0B`): Pending reservations, high-urgency queuing, low battery (<40% SoC).
  - **Electric Cyan** (`#06B6D4`): Energy delivered (kWh), active charging rate (kW), telemetry streams.
  - **Crimson Red** (`#EF4444`): Critical battery (<20% SoC), turnstile check-in rejection, station maintenance.
- **Responsive Layout**: Replaced problematic fixed positioning with standard CSS flex flow:
  - Sticky desktop sidebar (`w-64 shrink-0 h-screen sticky top-0`) with zero content clipping or overlap.
  - Seamless off-canvas mobile drawer with smooth backdrop blur transitions.
  - Micro-interactions: Framer-like hover elevations (`hover:-translate-y-0.5`), active glow rings, and clean Lucide icons.

### 2. End-to-End System Validation (12-Step Test Suite)
All 12 critical application pathways are systematically validated using the automated test suite `validate_phase8.ps1`:

| Step | Validation Test | Tested Endpoint / Component | Verification Outcome |
|:---:|---|---|:---:|
| **1** | Dashboard KPI Telemetry | `GET /api/analytics/summary` | **PASS** (13 EVs, 5 Bays, 197.97 kWh, ₹2,969.55 billing loaded) |
| **2** | Fleet & Station Inventory | `GET /api/vehicles`, `GET /api/stations` | **PASS** (13 vehicles, 5 stations retrieved with full attributes) |
| **3** | Dynamic EV Registration | `POST /api/vehicles` | **PASS** (Created EV with unique QR identifier & initial 20 kWh SoC) |
| **4** | Digital QR Pass Lookup | `GET /api/vehicles/qr/{qrIdentifier}` | **PASS** (Verified instant EV telemetry resolution via QR identity) |
| **5** | Station Bay Check-In | `POST /api/charging/check-in` | **PASS** (Turnstile authorization granted for compatible Available bay) |
| **6** | Compatibility & Availability | Engine Connector Matrix | **PASS** (Type 2 connector compatibility & Station 1 availability verified) |
| **7** | Negative Safety Interlocks | Check-In Rejection Guards | **PASS** (4/4 rejected: Inactive EV, Maintenance bay, Occupied bay, Active charging EV. Zero state mutation) |
| **8** | Slot Collision Prevention | `POST /api/charging/reserve` | **PASS** (Created reservation; blocked overlapping interval $(s_1 < e_2 \land s_2 < e_1)$ with `HTTP 400/409`) |
| **9** | Transactional Start Charging | `POST /api/charging/start` | **PASS** (Atomic session start; Station $\to$ `OCCUPIED`, EV $\to$ `CHARGING`) |
| **10** | Session Completion & Billing | `POST /api/charging/complete` | **PASS** (Delivered 27.0 kWh; billed ₹405.00 at standard ₹15.00/kWh tariff) |
| **11** | State Restoration & Sync | Post-Session Ledgers | **PASS** (Station restored to `AVAILABLE`; EV battery updated to 80%; analytics synced) |
| **12** | Direct MySQL ACID Audit | Relational SQL Query Check | **PASS** (Direct MySQL audit confirmed referential integrity and zero orphan states) |

### 3. Live Demonstration Script for Evaluators (5 Core Pillars)

When presenting VoltLoop during project evaluations, follow this structured walkthrough:

1. **Pillar 1: Campus Fleet & Real-Time Overview (`/dashboard`)**
   - Point out the 5 live KPI cards (Total Fleet, Active Bays, Available Bays, Energy Dispensed, Total Revenue).
   - Demonstrate the live energy consumption SVG chart and show how it dynamically responds to completed sessions.
   - Show the Station Utilization table with power ratings and connector standards.
2. **Pillar 2: EV Telemetry & Digital Boarding Pass (`/vehicles`)**
   - Search for an EV using the search bar.
   - Open **Vehicle Details** (`/vehicles/1`) to view the battery state-of-charge gauge.
   - Show the **Digital EV QR Pass** (`<EVQRPass />`) generated using high-density 2D QR encoding. Point out that only the opaque identifier is encoded for privacy and security.
3. **Pillar 3: Metro-Style Station Check-In & Safety Interlocks (`/station-checkin`)**
   - Open the Check-In Terminal. Select Station 1 (`CS-ENGG-01`).
   - Use the camera scanner or click the sample chip `VL-EV-001` to trigger check-in.
   - Show the **Authorized Gate Pass** card: confirm connector compatibility and station readiness.
   - **Demonstrate Negative Interlocks**: Select Maintenance Station (`CS-SPORTS-01`) or Inactive EV (`VL-EV-007`) to show the immediate **Rejection Card** with specific safety explanation and zero database side effects.
4. **Pillar 4: Intelligent Smart Charging Engine (`/smart-charging`)**
   - Select an EV with depleted battery (e.g., `VL-EV-002` at 18.5%).
   - Adjust the Target Battery slider to 80% and virtual queue waiting time to 25 minutes.
   - Click "Analyze & Recommend Station": show the explainable **Priority Score** (Urgency + Wait Time points) and observe the recommendation engine assigning the fastest compatible DC fast charger.
5. **Pillar 5: Charging Lifecycle & Billing Settlement (`/sessions`)**
   - Click "Start Charging" to activate the session.
   - Show that Station 1 immediately transitions to `OCCUPIED` and the EV transitions to `CHARGING`.
   - In the **Charging Sessions** tab, click "Complete Session & Calculate Bill".
   - Input final SoC (e.g., 85%). Show the live bill calculation: $\text{kWh Delivered} \times ₹15.00/\text{kWh}$.
   - Confirm that the station automatically returns to `AVAILABLE` and the EV battery updates in the database.

### 4. Real System Capabilities vs. Software Simulation Disclosures
To maintain highest academic and engineering integrity, VoltLoop explicitly delineates implemented software systems from simulated physical hardware:

- **Fully Real & Production Implemented**:
  - Pure JDBC data access layer with HikariCP connection pooling and ACID transaction controls (`setAutoCommit(false)`, `commit()`, `rollback()`).
  - Production MySQL 8.0 schema with foreign key constraints, CHECK constraints, and B-tree indexes.
  - Spring Boot 3.2 REST API controllers with comprehensive error handling.
  - Mathematical interval collision prevention logic $(s_1 < e_2 \land s_2 < e_1)$.
  - High-density client-side 2D QR code generation and real device camera scanning (`html5-qrcode`).
  - Exact financial billing calculations at ₹15.00/kWh and energy metering.
- **Simulated Hardware Features (PBL Scope)**:
  - Physical EV battery chemistry and depletion curve (represented via digital telemetry state-of-charge updates).
  - Physical smart plug latching and ISO 15118 / OCPP hardware communications (represented via Turnstile Check-In API interlocks).
  - Virtual queue delay slider for examining priority scoring algorithms under high campus demand.
  - Multi-method payment gateway checkout (simulated UPI, Card, Net Banking, and Campus Wallet with realistic network delay and explicit success/failure testing toggles).

---

## 7. Phase 8 & 9 Dual-Portal Architecture & System Validation

VoltLoop features a unified **Dual-Portal Architecture** connecting a single enterprise Java Spring Boot backend and MySQL 8.0 database to two distinct role-tailored user interfaces:

```
                          ┌───────────────────────────┐
                          │   VoltLoop Dual-Portal    │
                          │   Frontend Application    │
                          │  http://localhost:5173    │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
  ┌─────────────────────────────┐               ┌─────────────────────────────┐
  │        Owner Portal         │               │       Customer Portal       │
  │    (Station Operators)      │               │     (Campus EV Drivers)     │
  ├─────────────────────────────┤               ├─────────────────────────────┤
  │ • Live KPI Overview         │               │ • Personal Fleet Dashboard  │
  │ • Real-Time Bay Telemetry   │               │ • Station QR Code Scanner   │
  │ • Rapid Status Controls     │               │ • Multi-EV Registration     │
  │ • Verified Revenue Ledger   │               │ • 7-Step Advance Bookings   │
  │ • Real-time Session Monitor │               │ • Active Charging Control   │
  │ • Customer Charging Audit   │               │ • Simulated Checkout Flow   │
  │ • Station QR Generator      │               │ • GST Tax Invoice Receipts  │
  └──────────────┬──────────────┘               └──────────────┬──────────────┘
                 │                                             │
                 │   Role-Guarded Bearer Authentication Tokens │
                 └──────────────────────┬──────────────────────┘
                                        ▼
                 ┌─────────────────────────────────────────────┐
                 │       Java 17 Spring Boot REST Backend       │
                 │            http://localhost:8080            │
                 ├─────────────────────────────────────────────┤
                 │ • /api/auth (BCrypt Hashes, HMAC-SHA256)    │
                 │ • /api/owner (Strict 403 Role Enforcement)  │
                 │ • /api/customer (Customer Data Isolation)   │
                 │ • /api/payments (Simulated Gateway & Tax)   │
                 │ • /api/charging (Interval Algebra & ACID)   │
                 └──────────────────────┬──────────────────────┘
                                        │ Pure JDBC / HikariCP
                                        ▼
                 ┌─────────────────────────────────────────────┐
                 │              MySQL 8.0 Engine               │
                 │ (users, charging_stations, vehicles,        │
                 │  charging_sessions, reservations, payments) │
                 └─────────────────────────────────────────────┘
```

### Pre-Configured Demo Credentials

| Portal | Stakeholder | Email | Password | Assigned Permissions |
|---|---|---|---|---|
| **Owner Portal** | Dr. Rajesh Sharma | `rajesh.sharma@campus.edu` | `Owner@VoltLoop2026` | Station bay management, maintenance toggles, verified revenue audit, fleet telemetry |
| **Owner Portal** | Priya Patel | `priya.patel@campus.edu` | `Owner@VoltLoop2026` | Secondary operator monitoring and campus grid analytics |
| **Customer Portal** | Amit Verma | `amit.verma@campus.edu` | `Customer@2026` | Personal EV fleet management, station QR check-in, charging sessions, simulated payments |
| **Customer Portal** | Sneha Nair | `sneha.nair@campus.edu` | `Customer@2026` | Personal EV driver portal and advance reservation bookings |

### Campus Station QR Identifiers
For testing physical bay scanning and manual code fallback:
- `VL-ST-001` — Engineering Block (*Type 2, 22.0 kW AC*)
- `VL-ST-002` — Admin Complex (*CCS2, 50.0 kW DC Fast Charger*)
- `VL-ST-003` — Hostel Zone (*Type 2, 7.4 kW AC*)
- `VL-ST-004` — Workshop Bay (*CCS2, 60.0 kW DC Fast Charger*)
- `VL-ST-005` — Sports Complex (*Standard 15A, 3.3 kW AC — Maintenance Bay*)

### Verified Revenue vs. Payment Simulation Disclosures
1. **Realized Revenue Accounting**: The Owner Portal revenue ledger (`/api/owner/revenue`) strictly counts and aggregates transactions where `status = 'SUCCESSFUL'`. Pending and failed transactions are retained for transaction audit logs but excluded from realized revenue totals.
2. **PBL Simulated Checkout**: All payment flows (UPI QR, Credit/Debit Card, Net Banking, Campus Student Wallet) are simulated with realistic latency and an explicit `simulateSuccess: false` switch to demonstrate failed transaction recovery and edge-case handling without requiring real credit cards or bank accounts.
3. **Data Isolation**: Customers can view only their own vehicles, sessions, and tax invoices. Attempting cross-customer access is rejected with `HTTP 400 Access Denied`.

### Automated Test Suites & Verification Results

All tests execute and pass 100% against the live environment:

1. **Retrospective Phase 8 Integration Audit (`audit_phase8_retrospective.ps1`)**:
   - **11 / 11 PASSED (100%)**: BCrypt password verification, server-side role enforcement (HTTP 403), owner station authorization, customer data isolation, station QR resolution, interval algebra conflict rejection (HTTP 409), duplicate charging block, lifecycle settlement, tax receipt isolation, verified revenue ledger integrity, and Vite production bundle verification.
2. **Phase 9 End-to-End Suite (`validate_phase9.ps1`)**:
   - **14 / 14 PASSED (100%)**: Dual authentication, registration, QR resolution, customer profile update, charging lifecycle, payment simulation, tax receipts, failed payment handling, owner revenue, and hardware toggling.
3. **Phase 8 Campus Operations Suite (`validate_phase8.ps1`)**:
   - **12 / 12 PASSED (100%)**: Turnstile check-in, negative safety interlocks, slot interval collision prevention, transactional charging, energy calculation, and direct MySQL ACID persistence.
4. **Backend Unit & Integration Tests**:
   - `mvn test`: **7 / 7 PASSED (0 Failures, 0 Errors)**.
5. **Frontend Production Build**:
   - `npm run build`: **0 Errors** (`dist/index.html` generated in ~28s).

### Exact Launch Commands & Local URLs

1. **Database (MySQL 8.0)**:
   - Live native Windows service: `MySQL80` on port 3306 (already running)
   - Alternative Docker deployment:
     ```powershell
     docker compose up -d mysql
     ```
2. **Backend (Java 17 + Spring Boot)**:
   ```powershell
   cd backend
   $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
   $env:Path = "$env:JAVA_HOME\bin;C:\ProgramData\apache-maven-3.9.6\bin;$env:Path"
   mvn spring-boot:run
   ```
   - **Backend Root URL**: [http://localhost:8080](http://localhost:8080)
3. **Frontend (React 18 + Vite)**:
   ```powershell
   cd frontend
   npm run dev
   ```
   - **Frontend Web URL**: [http://localhost:5173](http://localhost:5173)

