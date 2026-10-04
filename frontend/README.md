# VoltLoop — React Frontend

The official web frontend for **VoltLoop — Smart Campus EV Fleet & Energy Management System**.

Built with **React 18**, **Vite**, **React Router v6**, and **Lucide React**.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Java Backend**: Spring Boot REST API running on `http://localhost:8080`
- **Database**: MySQL 8.0 running via Docker or native service on `localhost:3306`

### Installation
```bash
cd frontend
npm install
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

## 2. Project Structure

```
frontend/
├── public/
│   └── favicon.svg                  # Brand lightning loop icon
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Header with live backend connection badge
│   │   ├── QRScanner.jsx            # Interactive camera & manual QR identification
│   │   ├── StatusBadge.jsx          # Reusable status indicator
│   │   ├── StatCard.jsx             # Metric card for KPIs
│   │   ├── LoadingSpinner.jsx       # Animated loading indicator
│   │   └── ErrorAlert.jsx           # Clean error banner
│   ├── pages/
│   │   ├── Dashboard.jsx            # /dashboard: Fleet KPIs, active chargers, available bays
│   │   ├── Vehicles.jsx             # /vehicles: Fleet table, register EV modal, battery updater
│   │   ├── VehicleDetails.jsx       # /vehicles/:id: EV profile, battery gauge, charging history
│   │   ├── Stations.jsx             # /stations: Campus charging bays, power kW, maintenance control
│   │   ├── Reservations.jsx         # /reservations: Slot booking with 409 Conflict alerts
│   │   ├── ChargingSessions.jsx     # /sessions: Active charging monitor & completion billing
│   │   └── SmartCharging.jsx        # /smart-charging: Decision engine, priority scores, turnaround time
│   ├── services/
│   │   └── api.js                   # Centralized API service with human-friendly error translation
│   ├── utils/
│   │   └── formatters.js            # Date, currency (₹), energy (kWh), duration formatters
│   ├── App.jsx                      # Client router and global quick scan modal
│   ├── main.jsx                     # Application root mount
│   └── index.css                    # Modern fleet dashboard design system
├── index.html                       # HTML5 entry with fonts
├── package.json                     # Dependencies & scripts
└── vite.config.js                   # Development proxy to http://localhost:8080
```

---

## 3. Connected Backend APIs

All API communications route to `http://localhost:8080/api`:
- **Vehicles**: `/api/vehicles`, `/api/vehicles/qr/{qr}`, `/api/vehicles/{id}/battery`
- **Stations**: `/api/stations`, `/api/stations/available`, `/api/stations/{id}/status`
- **Reservations**: `/api/reservations`, `/api/reservations/{id}/cancel`
- **Sessions**: `/api/sessions`, `/api/sessions/active`, `/api/sessions/{id}/complete`
- **Smart Allocation**: `/api/charging/recommend`, `/api/charging/start`, `/api/charging/complete`, `/api/charging/reserve`, `/api/charging/history/{vehicleId}`
