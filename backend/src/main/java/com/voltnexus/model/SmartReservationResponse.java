package com.voltnexus.model;

import java.time.LocalDateTime;

public class SmartReservationResponse {
    private Integer reservationId;
    private Vehicle vehicle;
    private ChargingStation station;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer priorityScore;
    private String urgencyLevel;
    private Integer estimatedChargingMinutes;
    private String status;
    private String message;

    public SmartReservationResponse() {
    }

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
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

    public Integer getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(Integer priorityScore) {
        this.priorityScore = priorityScore;
    }

    public String getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(String urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }

    public Integer getEstimatedChargingMinutes() {
        return estimatedChargingMinutes;
    }

    public void setEstimatedChargingMinutes(Integer estimatedChargingMinutes) {
        this.estimatedChargingMinutes = estimatedChargingMinutes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
