-- =============================================================================
-- VoltLoop: Smart Campus EV Fleet & Energy Management System
-- Phase 2: Essential SQL Queries for Demonstration & Viva
-- Database: voltloop
-- =============================================================================

USE voltloop;

-- -----------------------------------------------------------------------------
-- Query 1: Display all registered EVs with driver details
-- Purpose: Overview of campus EV fleet assets and their current state.
-- -----------------------------------------------------------------------------
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.vehicle_type,
    v.qr_identifier,
    v.battery_capacity,
    v.current_battery,
    v.status AS vehicle_status,
    u.name AS owner_name,
    u.email AS owner_email,
    u.role AS owner_role
FROM vehicles v
JOIN users u ON v.user_id = u.user_id
ORDER BY v.vehicle_id ASC;


-- -----------------------------------------------------------------------------
-- Query 2: Find an EV using its unique QR identifier
-- Purpose: Core QR-scanning entry point. Rapidly resolves EV data from scanned QR.
-- -----------------------------------------------------------------------------
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.vehicle_type,
    v.qr_identifier,
    v.battery_capacity,
    v.current_battery,
    v.status AS vehicle_status,
    u.name AS driver_name,
    u.email AS driver_email
FROM vehicles v
JOIN users u ON v.user_id = u.user_id
WHERE v.qr_identifier = 'VL-EV-001';


-- -----------------------------------------------------------------------------
-- Query 3: Find EVs with battery below 30%
-- Purpose: Identifies vehicles requiring urgent charging allocation.
-- -----------------------------------------------------------------------------
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.vehicle_type,
    v.qr_identifier,
    v.current_battery,
    v.battery_capacity,
    v.status AS vehicle_status,
    u.name AS driver_name
FROM vehicles v
JOIN users u ON v.user_id = u.user_id
WHERE v.current_battery < 30.00
ORDER BY v.current_battery ASC;


-- -----------------------------------------------------------------------------
-- Query 4: Display available charging stations
-- Purpose: Real-time discovery of operational, ready-to-charge station bays.
-- -----------------------------------------------------------------------------
SELECT 
    station_id,
    station_name,
    location,
    charger_type,
    power_rating,
    connector_type,
    status
FROM charging_stations
WHERE status = 'AVAILABLE'
ORDER BY power_rating DESC;


-- -----------------------------------------------------------------------------
-- Query 5: Display charging history of a particular EV
-- Purpose: Auditing charging sessions, costs, and battery delta for a specific EV.
-- -----------------------------------------------------------------------------
SELECT 
    s.session_id,
    v.registration_no,
    v.qr_identifier,
    cs.station_name,
    cs.location,
    s.start_time,
    s.end_time,
    TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) AS duration_minutes,
    s.initial_battery,
    s.final_battery,
    (s.final_battery - s.initial_battery) AS battery_charged_pct,
    s.energy_consumed,
    s.charging_cost,
    s.status AS session_status
FROM charging_sessions s
JOIN vehicles v ON s.vehicle_id = v.vehicle_id
JOIN charging_stations cs ON s.station_id = cs.station_id
WHERE v.registration_no = 'KA-01-EV-2045'
ORDER BY s.start_time DESC;


-- -----------------------------------------------------------------------------
-- Query 6: Display currently active charging sessions
-- Purpose: Live monitoring of vehicles currently drawing power at stations.
-- -----------------------------------------------------------------------------
SELECT 
    s.session_id,
    v.registration_no,
    v.qr_identifier,
    v.vehicle_type,
    u.name AS driver_name,
    cs.station_name,
    cs.location,
    s.start_time,
    TIMESTAMPDIFF(MINUTE, s.start_time, NOW()) AS elapsed_minutes,
    s.initial_battery,
    s.energy_consumed AS current_energy_kwh,
    s.charging_cost AS current_cost,
    s.status
FROM charging_sessions s
JOIN vehicles v ON s.vehicle_id = v.vehicle_id
JOIN users u ON v.user_id = u.user_id
JOIN charging_stations cs ON s.station_id = cs.station_id
WHERE s.status = 'ACTIVE';


-- -----------------------------------------------------------------------------
-- Query 7: Calculate total energy consumed across all sessions
-- Purpose: Campus-wide energy metering and sustainability metrics.
-- -----------------------------------------------------------------------------
SELECT 
    ROUND(SUM(energy_consumed), 2) AS total_energy_consumed_kwh,
    COUNT(session_id) AS total_sessions_recorded
FROM charging_sessions;


-- -----------------------------------------------------------------------------
-- Query 8: Calculate total charging cost collected
-- Purpose: Revenue generation and energy expenditure reconciliation.
-- -----------------------------------------------------------------------------
SELECT 
    ROUND(SUM(charging_cost), 2) AS total_charging_revenue,
    ROUND(AVG(charging_cost), 2) AS average_cost_per_session
FROM charging_sessions;


-- -----------------------------------------------------------------------------
-- Query 9: Find the most frequently used charging station
-- Purpose: Identifies demand hotspots across the campus network.
-- -----------------------------------------------------------------------------
SELECT 
    cs.station_id,
    cs.station_name,
    cs.location,
    cs.charger_type,
    COUNT(s.session_id) AS total_sessions_conducted
FROM charging_stations cs
LEFT JOIN charging_sessions s ON cs.station_id = s.station_id
GROUP BY cs.station_id, cs.station_name, cs.location, cs.charger_type
ORDER BY total_sessions_conducted DESC
LIMIT 1;


-- -----------------------------------------------------------------------------
-- Query 10: Find average charging duration (in minutes and hours)
-- Purpose: Turnaround time analytics for completed charging sessions.
-- -----------------------------------------------------------------------------
SELECT 
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 1) AS avg_duration_minutes,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, start_time, end_time)) / 60, 2) AS avg_duration_hours
FROM charging_sessions
WHERE status = 'COMPLETED' AND end_time IS NOT NULL;


-- -----------------------------------------------------------------------------
-- Query 11: Find total energy consumed and cost by each EV
-- Purpose: EV fleet energy accounting and individual consumption breakdown.
-- -----------------------------------------------------------------------------
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.qr_identifier,
    v.vehicle_type,
    COUNT(s.session_id) AS total_charging_sessions,
    COALESCE(ROUND(SUM(s.energy_consumed), 2), 0.00) AS total_energy_kwh,
    COALESCE(ROUND(SUM(s.charging_cost), 2), 0.00) AS total_cost_paid
FROM vehicles v
LEFT JOIN charging_sessions s ON v.vehicle_id = s.vehicle_id
GROUP BY v.vehicle_id, v.registration_no, v.qr_identifier, v.vehicle_type
ORDER BY total_energy_kwh DESC;


-- -----------------------------------------------------------------------------
-- Query 12: Find station utilization (session count, energy delivered, revenue)
-- Purpose: Infrastructure utilization analysis to guide campus expansion.
-- -----------------------------------------------------------------------------
SELECT 
    cs.station_id,
    cs.station_name,
    cs.location,
    cs.power_rating,
    cs.status AS current_status,
    COUNT(s.session_id) AS total_sessions,
    COALESCE(ROUND(SUM(s.energy_consumed), 2), 0.00) AS total_energy_delivered_kwh,
    COALESCE(ROUND(SUM(s.charging_cost), 2), 0.00) AS total_revenue_generated
FROM charging_stations cs
LEFT JOIN charging_sessions s ON cs.station_id = s.station_id
GROUP BY cs.station_id, cs.station_name, cs.location, cs.power_rating, cs.status
ORDER BY total_sessions DESC;


-- -----------------------------------------------------------------------------
-- Query 13: Find reservations that overlap with another reservation (conflict detection)
-- Purpose: Detects double-booking conflicts on the same charging station.
-- Logic: Two intervals [S1, E1] and [S2, E2] overlap iff (S1 < E2) AND (E1 > S2).
-- -----------------------------------------------------------------------------
SELECT 
    r1.reservation_id AS res1_id,
    v1.registration_no AS res1_vehicle,
    r1.start_time AS res1_start,
    r1.end_time AS res1_end,
    r2.reservation_id AS res2_id,
    v2.registration_no AS res2_vehicle,
    r2.start_time AS res2_start,
    r2.end_time AS res2_end,
    cs.station_name,
    cs.location
FROM charging_reservations r1
JOIN charging_reservations r2 
    ON r1.station_id = r2.station_id 
    AND r1.reservation_id < r2.reservation_id
JOIN vehicles v1 ON r1.vehicle_id = v1.vehicle_id
JOIN vehicles v2 ON r2.vehicle_id = v2.vehicle_id
JOIN charging_stations cs ON r1.station_id = cs.station_id
WHERE r1.status IN ('RESERVED', 'ACTIVE')
  AND r2.status IN ('RESERVED', 'ACTIVE')
  AND r1.start_time < r2.end_time 
  AND r1.end_time > r2.start_time;


-- -----------------------------------------------------------------------------
-- Query 14: Display EVs currently charging
-- Purpose: Quick fleet status check for all vehicles plugged into chargers.
-- -----------------------------------------------------------------------------
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.qr_identifier,
    v.vehicle_type,
    v.status AS vehicle_status,
    cs.station_name,
    cs.location,
    s.session_id,
    s.start_time AS session_start,
    s.initial_battery,
    s.energy_consumed AS session_energy_kwh
FROM vehicles v
JOIN charging_sessions s ON v.vehicle_id = s.vehicle_id
JOIN charging_stations cs ON s.station_id = cs.station_id
WHERE s.status = 'ACTIVE' OR v.status = 'CHARGING';


-- -----------------------------------------------------------------------------
-- Query 15: Display monthly energy consumption
-- Purpose: Month-over-month energy metering and financial reporting.
-- -----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(start_time, '%Y-%m') AS billing_month,
    COUNT(session_id) AS total_sessions,
    ROUND(SUM(energy_consumed), 2) AS monthly_energy_kwh,
    ROUND(SUM(charging_cost), 2) AS monthly_revenue,
    ROUND(AVG(energy_consumed), 2) AS avg_energy_per_session
FROM charging_sessions
GROUP BY DATE_FORMAT(start_time, '%Y-%m')
ORDER BY billing_month DESC;
