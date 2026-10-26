package com.voltloop.model;

import java.time.LocalDateTime;

/**
 * Response payload for Charging Station Check-In and Authorization.
 */
public class CheckInResponse {
    private boolean authorized;
    private String status; // "AUTHORIZED" or "REJECTED"
    private String rejectionCode; // e.g. "INVALID_QR", "INACTIVE_VEHICLE", "STATION_NOT_FOUND", "STATION_UNAVAILABLE", "INCOMPATIBLE_CONNECTOR", "ALREADY_CHARGING", "RESERVATION_CONFLICT"
    private String reason;
    private Vehicle vehicle;
    private ChargingStation station;
    private ChargingReservation reservation;
    private boolean connectorCompatible;
    private LocalDateTime timestamp;

    public CheckInResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public CheckInResponse(boolean authorized, String status, String rejectionCode, String reason) {
        this.authorized = authorized;
        this.status = status;
        this.rejectionCode = rejectionCode;
        this.reason = reason;
        this.timestamp = LocalDateTime.now();
    }

    public boolean isAuthorized() {
        return authorized;
    }

    public void setAuthorized(boolean authorized) {
        this.authorized = authorized;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRejectionCode() {
        return rejectionCode;
    }

    public void setRejectionCode(String rejectionCode) {
        this.rejectionCode = rejectionCode;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public ChargingStation getStation() {
        return station;
    }

    public void setStation(ChargingStation station) {
        this.station = station;
    }

    public ChargingReservation getReservation() {
        return reservation;
    }

    public void setReservation(ChargingReservation reservation) {
        this.reservation = reservation;
    }

    public boolean isConnectorCompatible() {
        return connectorCompatible;
    }

    public void setConnectorCompatible(boolean connectorCompatible) {
        this.connectorCompatible = connectorCompatible;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
