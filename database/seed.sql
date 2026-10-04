-- =============================================================================
-- VoltNexus: Smart Campus EV Fleet & Energy Management System
-- Phase 2: Comprehensive Seed Data
-- Database: voltnexus
-- =============================================================================

USE voltnexus;

-- Clear previous test data before repopulating
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE charging_sessions;
TRUNCATE TABLE charging_reservations;
TRUNCATE TABLE charging_stations;
TRUNCATE TABLE vehicles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Seed: users (6 users: 1 Admin, 1 Operator, 4 Drivers)
-- -----------------------------------------------------------------------------
INSERT INTO users (user_id, name, email, role, status, created_at) VALUES
(1, 'Dr. Rajesh Sharma', 'rajesh.sharma@campus.edu', 'ADMIN', 'ACTIVE', '2026-08-01 09:00:00'),
(2, 'Priya Patel', 'priya.patel@campus.edu', 'OPERATOR', 'ACTIVE', '2026-08-05 10:15:00'),
(3, 'Amit Verma', 'amit.verma@campus.edu', 'DRIVER', 'ACTIVE', '2026-08-10 11:30:00'),
(4, 'Sneha Nair', 'sneha.nair@campus.edu', 'DRIVER', 'ACTIVE', '2026-08-15 14:00:00'),
(5, 'Vikram Singh', 'vikram.singh@campus.edu', 'DRIVER', 'ACTIVE', '2026-08-20 16:45:00'),
(6, 'Ananya Rao', 'ananya.rao@campus.edu', 'DRIVER', 'INACTIVE', '2026-09-01 12:00:00');

-- -----------------------------------------------------------------------------
-- 2. Seed: vehicles (8 EVs with unique QR identifiers)
-- -----------------------------------------------------------------------------
INSERT INTO vehicles (vehicle_id, user_id, vehicle_type, registration_no, battery_capacity, current_battery, qr_identifier, status, created_at) VALUES
(1, 3, '2-Wheeler (e-Scooter)',   'KA-01-EV-1021',  3.50,  85.00, 'VN-EV-001', 'ACTIVE',   '2026-08-12 10:00:00'),
(2, 4, '4-Wheeler (Compact EV)',  'KA-01-EV-2045', 32.00,  18.50, 'VN-EV-002', 'ACTIVE',   '2026-08-16 11:20:00'),
(3, 5, '4-Wheeler (Sedan EV)',    'KA-01-EV-3088', 40.00,  22.00, 'VN-EV-003', 'ACTIVE',   '2026-08-22 09:40:00'),
(4, 2, 'Campus Shuttle Bus',      'KA-01-EV-4099', 65.00,  55.00, 'VN-EV-004', 'CHARGING', '2026-08-25 15:10:00'),
(5, 3, '2-Wheeler (e-Motorbike)', 'KA-01-EV-5112',  4.00,  72.00, 'VN-EV-005', 'CHARGING', '2026-08-28 13:00:00'),
(6, 4, 'Maintenance Utility Cart','KA-01-EV-6230', 15.00,  90.00, 'VN-EV-006', 'ACTIVE',   '2026-09-02 08:30:00'),
(7, 6, '4-Wheeler (SUV EV)',      'KA-01-EV-7841', 50.00,  12.00, 'VN-EV-007', 'INACTIVE', '2026-09-05 16:15:00'),
(8, 5, 'Campus Delivery Van',     'KA-01-EV-8910', 45.00,  64.00, 'VN-EV-008', 'ACTIVE',   '2026-09-10 14:45:00');

-- -----------------------------------------------------------------------------
-- 3. Seed: charging_stations (5 Campus Charging Stations)
-- -----------------------------------------------------------------------------
INSERT INTO charging_stations (station_id, station_name, location, charger_type, power_rating, connector_type, status, created_at) VALUES
(1, 'CS-ENGG-01',    'Engineering Block North Lot',    'AC Level 2 Dual',   22.00, 'Type 2',       'AVAILABLE',   '2026-08-01 08:00:00'),
(2, 'CS-ADMIN-01',   'Main Admin Building Bay A',       'DC Fast Charger',   50.00, 'CCS2',         'OCCUPIED',    '2026-08-01 08:00:00'),
(3, 'CS-HOSTEL-01',  'Student Hostel Zone C Lot',      'AC Level 2 Single',  7.40, 'Type 2',       'OCCUPIED',    '2026-08-02 09:00:00'),
(4, 'CS-WORKSHOP-01','Central Workshop & Fleet Hub',   'DC Fast Charger',   60.00, 'CCS2',         'AVAILABLE',   '2026-08-03 10:00:00'),
(5, 'CS-SPORTS-01',  'Indoor Sports Complex Lot',      'AC Standard Socket', 3.30, 'Standard 15A', 'MAINTENANCE', '2026-08-04 11:00:00');

-- -----------------------------------------------------------------------------
-- 4. Seed: charging_reservations (Past, Active, Cancelled, and Overlapping)
-- -----------------------------------------------------------------------------
INSERT INTO charging_reservations (reservation_id, vehicle_id, station_id, start_time, end_time, status, created_at) VALUES
(1, 1, 1, '2026-09-28 09:00:00', '2026-09-28 11:00:00', 'COMPLETED', '2026-09-27 18:00:00'),
(2, 2, 2, '2026-09-29 14:00:00', '2026-09-29 15:30:00', 'COMPLETED', '2026-09-29 08:30:00'),
(3, 3, 3, '2026-09-30 18:00:00', '2026-09-30 20:00:00', 'COMPLETED', '2026-09-30 12:15:00'),
(4, 4, 2, '2026-10-04 13:00:00', '2026-10-04 15:00:00', 'ACTIVE',    '2026-10-04 11:00:00'),
(5, 6, 1, '2026-10-02 10:00:00', '2026-10-02 11:30:00', 'CANCELLED', '2026-10-01 17:00:00'),
-- Overlapping reservations on CS-ENGG-01 (Station 1) to demonstrate conflict detection:
(6, 2, 1, '2026-10-05 10:00:00', '2026-10-05 12:00:00', 'RESERVED',  '2026-10-04 10:00:00'),
(7, 8, 1, '2026-10-05 11:00:00', '2026-10-05 13:00:00', 'RESERVED',  '2026-10-04 11:30:00'),
-- Future non-conflicting reservation
(8, 3, 4, '2026-10-05 16:00:00', '2026-10-05 17:30:00', 'RESERVED',  '2026-10-04 12:00:00');

-- -----------------------------------------------------------------------------
-- 5. Seed: charging_sessions (Completed & Real-Time Active Sessions)
-- -----------------------------------------------------------------------------
INSERT INTO charging_sessions (session_id, vehicle_id, station_id, reservation_id, start_time, end_time, initial_battery, final_battery, energy_consumed, charging_cost, status, created_at) VALUES
-- Past Month Session (August - to demonstrate monthly aggregation query)
(1, 2, 2, NULL, '2026-08-25 15:00:00', '2026-08-25 16:15:00', 20.00, 80.00, 19.20, 288.00, 'COMPLETED', '2026-08-25 15:00:00'),

-- September Completed Sessions
(2, 1, 1, 1,    '2026-09-28 09:05:00', '2026-09-28 10:50:00', 20.00, 100.00,  3.10,  46.50, 'COMPLETED', '2026-09-28 09:05:00'),
(3, 2, 2, 2,    '2026-09-29 14:02:00', '2026-09-29 15:20:00', 15.00,  85.00, 22.40, 336.00, 'COMPLETED', '2026-09-29 14:02:00'),
(4, 3, 3, 3,    '2026-09-30 18:05:00', '2026-09-30 19:55:00', 25.00,  95.00, 28.00, 420.00, 'COMPLETED', '2026-09-30 18:05:00'),

-- October Completed Sessions
(5, 6, 4, NULL, '2026-10-01 11:00:00', '2026-10-01 12:15:00', 30.00,  90.00,  9.00, 135.00, 'COMPLETED', '2026-10-01 11:00:00'),
(6, 8, 1, NULL, '2026-10-03 08:30:00', '2026-10-03 10:30:00', 20.00,  75.00, 24.75, 371.25, 'COMPLETED', '2026-10-03 08:30:00'),

-- Currently ACTIVE Sessions (Real-time in progress)
-- Active Session 1: Campus Shuttle Bus charging at CS-ADMIN-01
(7, 4, 2, 4,    '2026-10-04 13:10:00', NULL,                  35.00,   NULL, 13.00, 195.00, 'ACTIVE',    '2026-10-04 13:10:00'),

-- Active Session 2: 2-Wheeler charging at CS-HOSTEL-01 via ad-hoc QR scan
(8, 5, 3, NULL, '2026-10-04 13:30:00', NULL,                  40.00,   NULL,  1.28,  19.20, 'ACTIVE',    '2026-10-04 13:30:00');
