# VoltLoop — React Frontend & Dashboard

The official web frontend for **VoltLoop — Smart Campus EV Fleet & Energy Management System**.

Built with **React 18**, **Vite**, **React Router v6**, and **Lucide React**, connecting directly to the Java Spring Boot REST API (`http://localhost:8080`) backed by MySQL 8.0 via JDBC.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **Java Backend**: Spring Boot REST API running on `http://localhost:8080`
- **Database**: MySQL 8.0 running via Docker or native service on `localhost:3306`

### Installation
```bash
cd frontend
npm install
```

### Environment Variables
Configure `.env` or set environment variables if needed:
```env
# Default points to Vite proxy (/api) which forwards to http://localhost:8080
VITE_API_BASE_URL=/api
```
If connecting across hosts or directly to the backend without proxy:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Run Development Server
```bash
npm run dev
```
The application will launch at: **`http://localhost:5173`**

### Build for Production
```bash
npm run build
```
Production assets will be emitted to `dist/`.

---

## 2. Available Pages & Routes

| Route | Page Component | Description |
|---|---|---|
| `/` or `/dashboard` | `Dashboard.jsx` | Command center displaying 5 KPI cards (Total EVs, Active Bays, Available Bays, Energy Dispensed, Total Revenue), active charging monitor, and recent session audit table. |
| `/evs` or `/vehicles` | `Vehicles.jsx` | Campus EV fleet inventory, search & filter by registration/QR, battery level indicator, driver profile, Register EV modal, and quick SoC update modal. |
| `/evs/:id` or `/vehicles/:id` | `VehicleDetails.jsx` | Individual EV telemetry details, circular battery gauge, battery pack capacity, owner information, and complete charging history table. |
| `/stations` or `/charging-stations` | `Stations.jsx` | Campus charging bays grid, power ratings (kW), charger architecture, connector standards, Add Bay modal, and maintenance toggle. |
| `/reservations` | `Reservations.jsx` | Slot reservation ledger, book new slot modal with real-time interval conflict detection (HTTP 409 alert banner), and cancellation control. |
| `/sessions` or `/charging-sessions` | `ChargingSessions.jsx` | Tabbed monitor for Active Charging Sessions and Completed History, session completion modal with real-time billing preview (₹15.00/kWh). |
| `/smart-charging` | `SmartCharging.jsx` | Centerpiece rule-based allocation engine. Integrated QR scanner / EV selector, desired target SoC slider, virtual queue wait time, instant recommendation calculation with priority scores, and one-click session activation. |
| `/analytics` | `Analytics.jsx` | Fleet energy metrics, total kWh dispensed, revenue ledger, daily charging trends SVG chart (Energy / Sessions / Billing tabs), and station utilization table. |

---

## 3. Reusable Component Library

- **`Sidebar.jsx`**: Left navigation sidebar with VoltLoop branding, active route highlight, live backend ping indicator (`Java Backend :8080`), and mobile collapsible drawer.
- **`Navbar.jsx`**: Sticky top header with dynamic page titles, refresh action, and quick QR scan launcher.
- **`BatteryIndicator.jsx`**: Visual battery state-of-charge gauge with color coding (`<20% CRITICAL`, `20-50% LOW`, `50-80% OPTIMAL`, `>80% FULL`), supporting bar, circular gauge, and pill variants.
- **`EVCard.jsx`**: Modular card representation of an EV with battery indicator, QR badge copy, driver info, and one-click charging shortcut.
- **`StationCard.jsx`**: Charging bay card showing power rating, connector type, operational status pill, and maintenance toggle.
- **`QRScanner.jsx`**: Dual-mode QR code scanner supporting camera simulation with animated scanning crosshairs and instant sample QR chips (`VL-EV-001` to `VL-EV-008`).
- **`Loading.jsx` / `LoadingSpinner.jsx`**: Canonical loading indicators with animated spinners and skeleton screen modes.
- **`ErrorMessage.jsx` / `ErrorAlert.jsx`**: Canonical error components with specialized HTTP 409 conflict formatting ("Charging station is already reserved during this time") and retry action.
- **`StatCard.jsx`**: Metric card for dashboard and analytics KPIs with customizable accent colors.
- **`StatusBadge.jsx`**: Status chip with color-coded badges for `AVAILABLE`, `OCCUPIED`, `CHARGING`, `MAINTENANCE`, `RESERVED`, and urgency levels.

---

## 4. API Service Layer (`src/services/api.js`)

Centralized service using native `fetch` with error translation:
- `getDashboard()`: Queries `/api/analytics/summary` or aggregates fleet metrics.
- `getVehicles()` / `getVehicleById(id)` / `getVehicleByQR(qr)`: Fleet queries.
- `createVehicle(data)`: Registers EV (`POST /api/vehicles`).
- `updateVehicleBattery(id, soc)`: Updates battery SoC (`PUT /api/vehicles/{id}/battery`).
- `getStations()` / `getAvailableStations()`: Charging bays queries.
- `createStation(data)`: Adds new bay (`POST /api/stations`).
- `updateStationStatus(id, status)`: Sets bay status (`PUT /api/stations/{id}/status`).
- `getReservations()` / `createReservation(data)` / `cancelReservation(id)`: Slot reservation endpoints.
- `getChargingSessions()` / `getActiveChargingSessions()`: Charging session records.
- `getSmartChargingRecommendation(data)`: Calculates optimal bay (`POST /api/charging/recommend`).
- `startCharging(data)`: Atomically activates charging (`POST /api/charging/start`).
- `completeCharging(data)`: Concludes session and audits bill (`POST /api/charging/complete`).
- `getAnalytics()`: Retrieves energy aggregations and daily trends (`GET /api/analytics`).

---

## 5. End-to-End Workflow & Testing Procedure

1. **Start Backend & Database**: Ensure MySQL 8.0 is running on port 3306 and Spring Boot is running on port 8080.
2. **Start Frontend**: `npm run dev` inside `frontend/` (opens at `http://localhost:5173`).
3. **Verify Dashboard**: Check that the 5 KPI cards populate with live database numbers.
4. **Test QR Flow**: Click "Quick Scan" on the navbar, select `VL-EV-002`, and verify instant EV telemetry lookup.
5. **Test Smart Allocation**: Navigate to `/smart-charging`, select an EV with low battery, run recommendation, and verify station assignment based on power rating and connector compatibility.
6. **Test Charging Activation**: Click "Start Charging Immediately" and verify the bay becomes `OCCUPIED` and EV becomes `CHARGING`.
7. **Test Session Completion**: Go to `/sessions`, click "Complete Session & Calculate Bill", set final battery to 100%, and verify energy (kWh) and cost (₹) are recorded.
8. **Test Reservation Conflict**: Go to `/reservations`, attempt to book an overlapping time slot, and observe the `HTTP 409 Conflict` alert banner.
