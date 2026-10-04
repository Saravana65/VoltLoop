# VoltNexus — Smart Campus EV Fleet & Energy Management System

A product-like, full-stack college Project-Based Learning (PBL) application designed to monitor, identify, allocate, and optimize electric vehicle charging and energy consumption across university campus infrastructure.

---

## 1. Problem Statement

With the rapid adoption of electric two-wheelers, faculty electric cars, and campus shuttle fleets, universities face significant charging infrastructure challenges:
- **Queueing & Slot Bottlenecks**: Drivers compete for charging bays without real-time station availability.
- **Physical Identification Delays**: Difficulty in verifying vehicle ownership, battery health, and eligibility at stations.
- **Energy Accounting Gaps**: Lack of visibility into real kilowatt-hour (kWh) power consumption and charging costs.
- **Double Booking Conflicts**: Unmanaged reservations leading to schedule collisions.

**VoltNexus** solves this through automated QR-based EV identification, intelligent reservation conflict checks, real-time station state synchronization, and energy consumption auditing.

---

## 2. Core Project Features

1. **EV Registration and Fleet Asset Management**: Stores vehicle profiles, battery capacities, and active states.
2. **QR-Based EV Identification**: Every registered EV possesses a unique `qr_identifier` (e.g. `VN-EV-001`). Scanning retrieves EV telemetry instantly.
3. **Charging Station Management**: Tracks station bays, charger types (AC Level 2, DC Fast), power ratings (kW), and connector standards (CCS2, Type 2).
4. **Charging Slot Conflict Detection**: Prevents overlapping reservations on the same bay via interval collision detection.
5. **Real-Time Charging Session Management**: Captures initial battery, dynamic charging states, and timestamps.
6. **Energy Consumption Tracking**: Calculates energy dispensed in kilowatt-hours (kWh) per session.
7. **Charging Cost Calculation**: Automatically reconciles billing based on kWh delivered.
8. **EV Usage History**: Auditing of charging logs per vehicle.
9. **Station Utilization Analytics**: Measures usage frequency and energy throughput across campus stations.
10. **Role-Based Users**: Administrator, Fleet Operator, and Driver stakeholders.
11. **Admin & Live Dashboard**: Real-time fleet and bay monitoring.

---

## 3. Technology Stack

- **Frontend**: React.js (Planned for Phase 4)
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
└───────────────────────────┬────────────────────────────┘
                            │  HTTP / JSON REST API
┌───────────────────────────▼────────────────────────────┐
│                  Java Backend Layer                    │
│    - Spring Boot REST Controllers                      │
│    - Business Logic & Conflict Detection Services      │
│    - Transaction Management (@Transactional)           │
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
│    - Database: voltnexus                               │
│    - Primary Keys, Foreign Keys, CHECK Constraints     │
│    - B-tree Indexes (Fast QR & Slot Collision Lookups) │
└───────────────────────────┬────────────────────────────┘
                            │  Containerized Virtualization
┌───────────────────────────▼────────────────────────────┐
│                    Docker Container                    │
│    - Image: mysql:8.0                                  │
│    - Persistent Volume: voltnexus_db_data              │
└────────────────────────────────────────────────────────┘
```

---

## 5. Development Phases & Current Status

| Phase | Milestone | Status | Description |
|---|---|---|---|
| **Phase 1** | Project Structure & Tooling | **Complete** | Scaffolding directories, Docker Compose setup, and architecture documentation. |
| **Phase 2** | Relational Database & Seed Data | **Complete** | 5 core tables, relational schema, CHECK constraints, realistic seed dataset, 15 analytical queries. |
| **Phase 3** | Java Backend + JDBC Connectivity | **Complete** | Spring Boot REST API, JDBC repositories with `PreparedStatement`, QR identification endpoint, session lifecycle, and unit tests. |
| **Phase 4** | Smart Charging Allocation Engine & QR Workflow | **Complete** | Rule-based priority scoring, charger compatibility matrix, slot overlap conflict detection, pure JDBC transaction control, and session energy/cost auditing. |
| **Phase 5** | React Frontend & Dashboard UI | **Complete** | Modern React 18 + Vite frontend, responsive dark fleet dashboard, QR identification UI, smart allocation recommendation page, and centralized API layer. |

---

## 6. Smart Charging Allocation Engine (Phase 4)

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

## 7. Phase 4 Smart Allocation REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/charging/recommend` | Evaluates priority, filters compatible stations, calculates energy/duration, and returns best station. |
| `GET` | `/api/charging/stations/recommended/{vehicleId}` | Quick recommendation by EV ID. |
| `POST` | `/api/charging/reserve` | Books a charging bay reservation with interval conflict detection (returns `409` on overlap). |
| `POST` | `/api/charging/start` | Transactionally activates charging session, sets EV to `CHARGING`, and bay to `OCCUPIED`. |
| `POST` | `/api/charging/complete` | Concludes session, calculates kWh delivered & cost, updates battery, and releases bay to `AVAILABLE`. |
| `GET` | `/api/charging/history/{vehicleId}` | Retrieves all completed and active charging sessions for an EV. |
| `GET` | `/api/charging/active` | Real-time list of all active charging sessions across campus. |

---

## 8. Quick Start Guide

### Step 1: Database Setup (Docker or Local MySQL)
VoltNexus works seamlessly with either Docker or native MySQL 8.0:

- **Option A (Docker):**
  ```bash
  docker compose up -d
  ```
- **Option B (Native Windows MySQL):**
  Connect to `localhost:3306` with credentials `voltnexus_user / voltnexus_pass` or root.

### Step 2: Start the Java Backend
```bash
cd backend
mvn clean test
mvn spring-boot:run
```
The REST API will boot on `http://localhost:8080`.

### Step 3: Test Key Endpoints

- **Identify Vehicle by QR Code:**
  ```bash
  curl http://localhost:8080/api/vehicles/qr/VN-EV-001
  ```
- **Get Smart Station Recommendation for EV 2:**
  ```bash
  curl -X POST http://localhost:8080/api/charging/recommend \
    -H "Content-Type: application/json" \
    -d "{\"vehicleId\": 2, \"targetBatteryPercentage\": 80.0}"
  ```
- **List Active Charging Sessions Across Campus:**
  ```bash
  curl http://localhost:8080/api/charging/active
  ```

---

## 7. QR Identification & Charging Lifecycle Flow

```
[ Driver Scans QR Code on EV ]
              │
              ▼
GET /api/vehicles/qr/{qrIdentifier}
              │
              ▼
[ Backend Performs Indexed O(1) JDBC Query ]
              │
              ▼
[ Returns: Registration, Battery %, Capacity, Owner Info ]
              │
              ▼
[ Driver Selects Available Station Bay ]
              │
              ▼
POST /api/sessions/start
              │
              ▼
[ Backend Validates: Vehicle NOT already charging ]
[ Updates EV status -> 'CHARGING', Station -> 'OCCUPIED' ]
              │
              ▼
[ Power Dispensing Underway ]
              │
              ▼
PUT /api/sessions/{id}/complete
              │
              ▼
[ Computes kWh Consumed & Cost ]
[ Updates EV status -> 'ACTIVE', Battery -> 100%, Station -> 'AVAILABLE' ]
```
