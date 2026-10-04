package com.voltnexus.model;

import java.time.LocalDateTime;

public class SmartReservationRequest {
    private Integer vehicleId;
    private String qrIdentifier;
    private Integer stationId; // Optional: If null, allocation engine auto-assigns optimal station
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public SmartReservationRequest() {
    }

    public SmartReservationRequest(String qrIdentifier, Integer stationId, LocalDateTime startTime, LocalDateTime endTime) {
        this.qrIdentifier = qrIdentifier;
        this.stationId = stationId;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getQrIdentifier() {
        return qrIdentifier;
    }

    public void setQrIdentifier(String qrIdentifier) {
        this.qrIdentifier = qrIdentifier;
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
}
