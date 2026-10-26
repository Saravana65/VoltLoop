-- =============================================================================
-- VoltLoop: Smart Campus EV Fleet & Energy Management System
-- Phase 9: Dual-Portal Architecture — Owner & Customer Schema Migration
-- Database: voltloop
-- Target Engine: MySQL 8.0+
-- =============================================================================

USE voltloop;

-- -----------------------------------------------------------------------------
-- 1. Table Alterations: users (Dual-Role Auth & Credentials)
-- -----------------------------------------------------------------------------
ALTER TABLE users MODIFY COLUMN role VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER';

-- Add password_hash and phone if they don't already exist
SET @col_exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = 'voltloop' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash');
SET @sql_stmt = IF(@col_exist = 0, 'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = 'voltloop' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone');
SET @sql_stmt = IF(@col_exist = 0, 'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER role', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed BCrypt Passwords for Default System Accounts:
-- Owner: Dr. Rajesh Sharma (rajesh.sharma@campus.edu / Owner@VoltLoop2026)
UPDATE users 
SET role = 'OWNER', 
    phone = '+91 98450 11223', 
    password_hash = '$2a$10$CHDlnlIb0/AbO6RnCgN7P.ymLM7Gypic1KDt0T.xKg.HBLqt.gWQe' 
WHERE user_id = 1;

-- Secondary Owner / Operator: Priya Patel
UPDATE users 
SET role = 'OWNER', 
    phone = '+91 98450 22334', 
    password_hash = '$2a$10$CHDlnlIb0/AbO6RnCgN7P.ymLM7Gypic1KDt0T.xKg.HBLqt.gWQe' 
WHERE user_id = 2;

-- Customers: Amit Verma, Sneha Nair, Vikram Singh, Ananya Rao (Customer@2026)
UPDATE users 
SET role = 'CUSTOMER', 
    phone = '+91 98450 33445', 
    password_hash = '$2a$10$5WqIXzaO0M5jRYTHfxyy1.070WAup3BIm3LsGqVZkB0YItH3ajqU6' 
WHERE user_id = 3;

UPDATE users 
SET role = 'CUSTOMER', 
    phone = '+91 98450 44556', 
    password_hash = '$2a$10$5WqIXzaO0M5jRYTHfxyy1.070WAup3BIm3LsGqVZkB0YItH3ajqU6' 
WHERE user_id = 4;

UPDATE users 
SET role = 'CUSTOMER', 
    phone = '+91 98450 55667', 
    password_hash = '$2a$10$5WqIXzaO0M5jRYTHfxyy1.070WAup3BIm3LsGqVZkB0YItH3ajqU6' 
WHERE user_id = 5;

UPDATE users 
SET role = 'CUSTOMER', 
    phone = '+91 98450 66778', 
    password_hash = '$2a$10$5WqIXzaO0M5jRYTHfxyy1.070WAup3BIm3LsGqVZkB0YItH3ajqU6' 
WHERE user_id = 6;

-- Set default password for any newly registered test users without password_hash
UPDATE users 
SET password_hash = '$2a$10$5WqIXzaO0M5jRYTHfxyy1.070WAup3BIm3LsGqVZkB0YItH3ajqU6' 
WHERE password_hash IS NULL;

-- -----------------------------------------------------------------------------
-- 2. Table Alterations: charging_stations (Owner Assignment & Station QR)
-- -----------------------------------------------------------------------------
SET @col_exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = 'voltloop' AND TABLE_NAME = 'charging_stations' AND COLUMN_NAME = 'owner_id');
SET @sql_stmt = IF(@col_exist = 0, 'ALTER TABLE charging_stations ADD COLUMN owner_id INT NULL AFTER station_id', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = 'voltloop' AND TABLE_NAME = 'charging_stations' AND COLUMN_NAME = 'qr_code');
SET @sql_stmt = IF(@col_exist = 0, 'ALTER TABLE charging_stations ADD COLUMN qr_code VARCHAR(50) NULL AFTER status', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Assign all current campus charging bays to Owner 1 (Dr. Rajesh Sharma)
UPDATE charging_stations SET owner_id = 1 WHERE owner_id IS NULL;

-- Assign unique Station QR codes for physical station scanning
UPDATE charging_stations SET qr_code = 'VL-ST-001' WHERE station_id = 1;
UPDATE charging_stations SET qr_code = 'VL-ST-002' WHERE station_id = 2;
UPDATE charging_stations SET qr_code = 'VL-ST-003' WHERE station_id = 3;
UPDATE charging_stations SET qr_code = 'VL-ST-004' WHERE station_id = 4;
UPDATE charging_stations SET qr_code = 'VL-ST-005' WHERE station_id = 5;

-- -----------------------------------------------------------------------------
-- 3. Table Alterations: charging_reservations & charging_sessions (Customer Link)
-- -----------------------------------------------------------------------------
SET @col_exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = 'voltloop' AND TABLE_NAME = 'charging_reservations' AND COLUMN_NAME = 'user_id');
SET @sql_stmt = IF(@col_exist = 0, 'ALTER TABLE charging_reservations ADD COLUMN user_id INT NULL AFTER vehicle_id', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE charging_reservations r 
JOIN vehicles v ON r.vehicle_id = v.vehicle_id 
SET r.user_id = v.user_id 
WHERE r.user_id IS NULL;

SET @col_exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = 'voltloop' AND TABLE_NAME = 'charging_sessions' AND COLUMN_NAME = 'user_id');
SET @sql_stmt = IF(@col_exist = 0, 'ALTER TABLE charging_sessions ADD COLUMN user_id INT NULL AFTER vehicle_id', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE charging_sessions s 
JOIN vehicles v ON s.vehicle_id = v.vehicle_id 
SET s.user_id = v.user_id 
WHERE s.user_id IS NULL;

-- -----------------------------------------------------------------------------
-- 4. New Table: payments (Verified Transactions, Receipts & Revenue Ledger)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NULL,
    reservation_id INT NULL,
    station_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'SIMULATED_UPI',
    transaction_ref VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    CONSTRAINT fk_payments_user FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_payments_session FOREIGN KEY (session_id)
        REFERENCES charging_sessions (session_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id)
        REFERENCES charging_reservations (reservation_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_payments_station FOREIGN KEY (station_id)
        REFERENCES charging_stations (station_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_payments_user (user_id),
    INDEX idx_payments_session (session_id),
    INDEX idx_payments_station (station_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_ref (transaction_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Backfill Verified Payments for Completed Charging Sessions
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO payments (user_id, session_id, station_id, amount, currency, payment_method, transaction_ref, status, simulated, created_at, completed_at)
SELECT 
    s.user_id,
    s.session_id,
    s.station_id,
    s.charging_cost,
    'INR',
    'SIMULATED_UPI',
    CONCAT('TXN-VL-INIT-', LPAD(s.session_id, 4, '0')),
    'SUCCESSFUL',
    TRUE,
    COALESCE(s.end_time, s.created_at),
    COALESCE(s.end_time, s.created_at)
FROM charging_sessions s
WHERE s.status = 'COMPLETED' AND s.charging_cost > 0;
