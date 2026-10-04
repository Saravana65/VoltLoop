# VoltNexus — Backend Service (Spring Boot + JDBC)

The backend service for **VoltNexus: Smart Campus EV Fleet & Energy Management System**.  
It provides a RESTful API layer built on **Java 17** and **Spring Boot**, utilizing **pure JDBC (`PreparedStatement`)** for all MySQL database interactions.

---

## Architecture Overview

```
React.js Frontend
       │
       ▼  HTTP / JSON REST API
Spring Boot Controllers
       │
       ▼  Domain Services & Business Validation
Spring Boot Services (@Transactional)
       │
       ▼  PreparedStatement & Parameterized SQL
JDBC Repositories (JdbcTemplate / java.sql.Connection)
       │
       ▼  TCP Port 3306
MySQL 8.0 (Docker Container: voltnexus-mysql)
```

---

## 1. Prerequisites

- **Java JDK 17+** (e.g., Microsoft OpenJDK 17 or Eclipse Temurin)
- **Apache Maven 3.8+**
- **Docker Desktop** (or Docker engine on Linux / WSL2)

---

## 2. How to Start MySQL Using Docker

From the project root:

```bash
# Start MySQL container with persistent volume and auto-initialized schema/seed data
docker compose up -d

# Verify container is running and healthy
docker compose ps
```

*Alternatively, if running the container manually:*
```bash
docker run -d \
  --name voltnexus-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=voltnexus \
  -e MYSQL_USER=voltnexus_user \
  -e MYSQL_PASSWORD=voltnexus_pass \
  mysql:8.0
```

---

## 3. Configuring Database Credentials

The backend avoids hardcoded credentials. It uses sensible defaults with environment variable overrides:

| Environment Variable | Default Value | Description |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL host (or container IP) |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `voltnexus` | Relational database schema name |
| `DB_USER` | `voltnexus_user` | Database user |
| `DB_PASSWORD` | `voltnexus_pass` | Database user password |

### Setting Environment Variables:

**Windows PowerShell:**
```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_USER="voltnexus_user"
$env:DB_PASSWORD="voltnexus_pass"
```

**Linux / macOS:**
```bash
export DB_HOST="localhost"
export DB_PORT="3306"
export DB_USER="voltnexus_user"
export DB_PASSWORD="voltnexus_pass"
```

---

## 4. How to Start the Java Backend

Inside the `backend/` directory:

```bash
# 1. Compile and run unit tests
mvn clean test

# 2. Run the Spring Boot application
mvn spring-boot:run

# Or package into an executable JAR:
mvn clean package -DskipTests
java -jar target/voltnexus-backend-1.0.0.jar
```

The application starts on **`http://localhost:8080`**.  
On startup, `DatabaseConfig` automatically runs a connectivity check and logs the MySQL product version, driver details, and connection URL.

---

## 5. REST API Endpoint Reference

### Vehicles & QR Identification
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | Retrieve all registered EVs with owner info |
| `GET` | `/api/vehicles/{id}` | Retrieve EV by vehicle ID |
| `GET` | `/api/vehicles/qr/{qrIdentifier}` | **QR Code EV lookup** (e.g. `VN-EV-001`) |
| `POST` | `/api/vehicles` | Register a new EV into the fleet |
| `PUT` | `/api/vehicles/{id}/battery` | Update real-time battery percentage |
| `PUT` | `/api/vehicles/{id}/status` | Update vehicle status (`ACTIVE`, `INACTIVE`, `CHARGING`) |

### Charging Stations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stations` | Retrieve all charging stations |
| `GET` | `/api/stations/available` | Retrieve currently available charging stations |
| `GET` | `/api/stations/{id}` | Retrieve station by ID |
| `POST` | `/api/stations` | Add a new charging station bay |
| `PUT` | `/api/stations/{id}/status` | Update station status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`) |

### Reservations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reservations` | Retrieve all charging reservations |
| `GET` | `/api/reservations/{id}` | Retrieve reservation by ID |
| `POST` | `/api/reservations` | Book a charging slot (includes overlap conflict check) |
| `PUT` | `/api/reservations/{id}/cancel` | Cancel an existing reservation |

### Charging Sessions (Live & History)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sessions` | Retrieve all charging sessions |
| `GET` | `/api/sessions/active` | Retrieve currently active charging sessions |
| `GET` | `/api/sessions/{id}` | Retrieve session by ID |
| `GET` | `/api/sessions/vehicle/{vehicleId}` | Retrieve charging history of a specific EV |
| `POST` | `/api/sessions/start` | Start charging session (updates EV & station state) |
| `PUT` | `/api/sessions/{id}/complete` | Finish session (computes kWh, cost, releases station) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/{id}` | Get user by ID |
| `POST` | `/api/users` | Create user |

---

## 6. Example Requests & Responses

### 1. QR Code Scan Identification
**Request:**
```http
GET /api/vehicles/qr/VN-EV-001 HTTP/1.1
Host: localhost:8080
```

**Response (`200 OK`):**
```json
{
  "vehicleId": 1,
  "userId": 3,
  "vehicleType": "2-Wheeler (e-Scooter)",
  "registrationNo": "KA-01-EV-1021",
  "batteryCapacity": 3.5,
  "currentBattery": 85.0,
  "qrIdentifier": "VN-EV-001",
  "status": "ACTIVE",
  "createdAt": "2026-08-12T15:30:00",
  "ownerName": "Amit Verma",
  "ownerEmail": "amit.verma@campus.edu"
}
```

### 2. Start Charging Session
**Request:**
```http
POST /api/sessions/start HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "vehicleId": 1,
  "stationId": 1
}
```

**Response (`201 Created`):**
```json
{
  "sessionId": 9,
  "vehicleId": 1,
  "stationId": 1,
  "reservationId": null,
  "startTime": "2026-10-04T15:07:30",
  "endTime": null,
  "initialBattery": 85.0,
  "finalBattery": null,
  "energyConsumed": 0.0,
  "chargingCost": 0.0,
  "status": "ACTIVE",
  "createdAt": "2026-10-04T15:07:30",
  "registrationNo": "KA-01-EV-1021",
  "qrIdentifier": "VN-EV-001",
  "stationName": "CS-ENGG-01",
  "stationLocation": "Engineering Block North Lot"
}
```

### 3. Complete Charging Session
**Request:**
```http
PUT /api/sessions/9/complete HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "finalBattery": 100.0,
  "energyConsumed": 0.53,
  "chargingCost": 7.95
}
```

**Response (`200 OK`):**
```json
{
  "sessionId": 9,
  "vehicleId": 1,
  "stationId": 1,
  "reservationId": null,
  "startTime": "2026-10-04T15:07:30",
  "endTime": "2026-10-04T15:35:10",
  "initialBattery": 85.0,
  "finalBattery": 100.0,
  "energyConsumed": 0.53,
  "chargingCost": 7.95,
  "status": "COMPLETED",
  "registrationNo": "KA-01-EV-1021",
  "qrIdentifier": "VN-EV-001"
}
```

### 4. Conflict Handling (Double Charging Prevention)
**Request:** Starting another session for a vehicle already charging.
```http
POST /api/sessions/start HTTP/1.1
Content-Type: application/json

{
  "vehicleId": 4,
  "stationId": 1
}
```

**Response (`409 Conflict`):**
```json
{
  "timestamp": "2026-10-04T15:06:59.102",
  "status": 409,
  "error": "Conflict",
  "message": "Vehicle with registration 'KA-01-EV-4099' is already actively charging."
}
```

---

## 7. Viva Explanation: Why and How JDBC is Used

Evaluators frequently ask why JDBC is chosen and how it works:

1. **What is JDBC?**  
   JDBC (*Java Database Connectivity*) is the core Java API specification (`java.sql.*`) that defines how a Java client connects to and executes queries against a relational database.

2. **Why PreparedStatement instead of Statement?**  
   - **SQL Injection Prevention:** In `PreparedStatement`, user input parameters are transmitted separately from the SQL statement template. The database driver treats parameters strictly as data values, neutralizing malicious inputs (such as `' OR '1'='1`).
   - **Query Precompilation:** The database parses, compiles, and optimizes the execution plan once. Subsequent executions reuse the compiled plan with new parameters.
   - **Type Safety:** Data types (e.g. `Timestamp`, `Double`, `Integer`) are safely converted by the driver without manual string escaping.

3. **Connection Pooling (`HikariCP`):**  
   Establishing a raw TCP socket and authenticating with MySQL takes 100-300ms. HikariCP keeps a pool of ready-to-use connections open. When an API request arrives, it borrows a connection, executes the JDBC operation, and returns it to the pool in under 1 millisecond.

4. **Transactional Integrity (`@Transactional`):**  
   When a charging session starts, two database actions must succeed together:  
   a) Insert record in `charging_sessions`  
   b) Update `vehicles.status = 'CHARGING'` and `charging_stations.status = 'OCCUPIED'`  
   If either fails, `@Transactional` performs an automatic rollback, preventing orphaned records.
