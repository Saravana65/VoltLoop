-- =============================================================================
-- VoltLoop: Smart Campus EV Fleet & Energy Management System
-- Phase 2: Relational Database Schema Definition
-- Database: voltloop
-- Target Engine: MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS voltloop;
USE voltloop;

-- Safely teardown existing tables if re-initializing
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS charging_sessions;
DROP TABLE IF EXISTS charging_reservations;
DROP TABLE IF EXISTS charging_stations;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- Represents system actors: Administrators, Campus EV Drivers, Fleet Operators.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'DRIVER', 'OPERATOR') NOT NULL DEFAULT 'DRIVER',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_email CHECK (email LIKE '%_@__%.__%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: vehicles
-- Represents campus electric vehicles (e-cars, e-bikes, campus shuttles).
-- Contains the unique QR identifier used for instant physical QR code scanning.
-- -----------------------------------------------------------------------------
CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    battery_capacity DECIMAL(6, 2) NOT NULL,
    current_battery DECIMAL(5, 2) NOT NULL,
    qr_identifier VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('ACTIVE', 'INACTIVE', 'CHARGING') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraint
    CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Logical Validation Constraints
    CONSTRAINT chk_vehicle_battery_capacity CHECK (battery_capacity > 0),
    CONSTRAINT chk_vehicle_current_battery CHECK (current_battery >= 0.00 AND current_battery <= 100.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: charging_stations
-- Represents charging stations and points located across the campus grounds.
-- -----------------------------------------------------------------------------
CREATE TABLE charging_stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(150) NOT NULL,
    charger_type VARCHAR(50) NOT NULL,
    power_rating DECIMAL(6, 2) NOT NULL,
    connector_type VARCHAR(50) NOT NULL,
    status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Logical Validation Constraint
    CONSTRAINT chk_station_power_rating CHECK (power_rating > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: charging_reservations
-- Represents advance booking of charging slots by EV drivers to avoid conflicts.
-- -----------------------------------------------------------------------------
CREATE TABLE charging_reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    station_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'RESERVED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_reservations_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_reservations_station FOREIGN KEY (station_id)
        REFERENCES charging_stations (station_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Logical Validation Constraint
    CONSTRAINT chk_reservation_time_range CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: charging_sessions
-- Represents real-time charging events initiated via QR scan or reservation.
-- -----------------------------------------------------------------------------
CREATE TABLE charging_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    station_id INT NOT NULL,
    reservation_id INT NULL,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    initial_battery DECIMAL(5, 2) NOT NULL,
    final_battery DECIMAL(5, 2) NULL,
    energy_consumed DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    charging_cost DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_sessions_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_sessions_station FOREIGN KEY (station_id)
        REFERENCES charging_stations (station_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_sessions_reservation FOREIGN KEY (reservation_id)
        REFERENCES charging_reservations (reservation_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Logical Validation Constraints
    CONSTRAINT chk_session_initial_battery CHECK (initial_battery >= 0.00 AND initial_battery <= 100.00),
    CONSTRAINT chk_session_final_battery CHECK (final_battery IS NULL OR (final_battery >= 0.00 AND final_battery <= 100.00)),
    CONSTRAINT chk_session_energy_consumed CHECK (energy_consumed >= 0.00),
    CONSTRAINT chk_session_charging_cost CHECK (charging_cost >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- =============================================================================

-- High-speed O(1) lookup during QR code scanning workflow
CREATE INDEX idx_vehicles_qr_identifier ON vehicles (qr_identifier);

-- Lookup by official vehicle registration plate
CREATE INDEX idx_vehicles_registration_no ON vehicles (registration_no);

-- Vehicle foreign key indexes for joining vehicle histories
CREATE INDEX idx_vehicles_user_id ON vehicles (user_id);
CREATE INDEX idx_reservations_vehicle_id ON charging_reservations (vehicle_id);
CREATE INDEX idx_reservations_station_id ON charging_reservations (station_id);

-- Composite index to accelerate slot conflict detection queries
CREATE INDEX idx_reservations_time_window ON charging_reservations (station_id, start_time, end_time);

-- Session indexing for tracking active sessions and aggregation
CREATE INDEX idx_sessions_vehicle_id ON charging_sessions (vehicle_id);
CREATE INDEX idx_sessions_station_id ON charging_sessions (station_id);
CREATE INDEX idx_sessions_status ON charging_sessions (status);
