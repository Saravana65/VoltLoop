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
| `POST` | `/api/charging/start` | Transactionally start charging session. |
| `POST` | `/api/charging/complete` | Complete session, calculate kWh & cost (₹), update battery, release bay. |
| `POST` | `/api/charging/recommend` | Rule-based smart station recommendation. |
| `GET` | `/api/analytics` | Aggregated fleet energy consumption, session duration, and station utilization. |
| `GET` | `/api/analytics/summary` | Summary KPIs for dashboard cards. |

---

## 8. Running the Complete Application

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
