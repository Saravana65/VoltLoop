package com.voltloop.model;

import java.time.LocalDateTime;

public class ChargingReservation {
    private Integer reservationId;
    private Integer vehicleId;
    private Integer stationId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status; // RESERVED, ACTIVE, COMPLETED, CANCELLED
    private LocalDateTime createdAt;

    // Display fields joined from vehicles and stations
    private String registrationNo;
    private String qrIdentifier;
    private String stationName;
    private String stationLocation;

    public ChargingReservation() {
    }

    public ChargingReservation(Integer reservationId, Integer vehicleId, Integer stationId,
                               LocalDateTime startTime, LocalDateTime endTime, String status,
                               LocalDateTime createdAt) {
        this.reservationId = reservationId;
        this.vehicleId = vehicleId;
        this.stationId = stationId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Integer getStationId() {
        return stationId;
    }

    public void setStationId(Integer stationId) {
        this.stationId = stationId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getRegistrationNo() {
        return registrationNo;
    }

    public void setRegistrationNo(String registrationNo) {
        this.registrationNo = registrationNo;
    }

    public String getQrIdentifier() {
        return qrIdentifier;
    }

    public void setQrIdentifier(String qrIdentifier) {
        this.qrIdentifier = qrIdentifier;
    }

    public String getStationName() {
        return stationName;
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
    }

    public String getStationLocation() {
        return stationLocation;
    }

    public void setStationLocation(String stationLocation) {
        this.stationLocation = stationLocation;
    }
}
