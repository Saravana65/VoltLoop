package com.voltloop.model;

import java.time.Duration;
import java.time.LocalDateTime;

public class ChargingSession {
    private Integer sessionId;
    private Integer userId;
    private Integer vehicleId;
    private Integer stationId;
    private Integer reservationId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double initialBattery;
    private Double finalBattery;
    private Double energyConsumed;
    private Double chargingCost;
    private String status; // ACTIVE, COMPLETED, CANCELLED
    private LocalDateTime createdAt;

    // Display fields joined from vehicles, stations, users, and payments
    private String userName;
    private String userEmail;
    private String registrationNo;
    private String qrIdentifier;
    private String vehicleType;
    private String stationName;
    private String stationLocation;
    private String connectorType;
    private Double powerRating;
    private String stationQrCode;
    private String paymentStatus; // PENDING, SUCCESSFUL, UNPAID
    private String transactionRef;

    public ChargingSession() {
    }

    public ChargingSession(Integer sessionId, Integer vehicleId, Integer stationId, Integer reservationId,
                           LocalDateTime startTime, LocalDateTime endTime, Double initialBattery,
                           Double finalBattery, Double energyConsumed, Double chargingCost,
                           String status, LocalDateTime createdAt) {
        this.sessionId = sessionId;
        this.vehicleId = vehicleId;
        this.stationId = stationId;
        this.reservationId = reservationId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.initialBattery = initialBattery;
        this.finalBattery = finalBattery;
        this.energyConsumed = energyConsumed;
        this.chargingCost = chargingCost;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Integer getSessionId() {
        return sessionId;
    }

    public void setSessionId(Integer sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
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

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
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

    public Double getInitialBattery() {
        return initialBattery;
    }

    public void setInitialBattery(Double initialBattery) {
        this.initialBattery = initialBattery;
    }

    public Double getFinalBattery() {
        return finalBattery;
    }

    public void setFinalBattery(Double finalBattery) {
        this.finalBattery = finalBattery;
    }

    public Double getEnergyConsumed() {
        return energyConsumed;
    }

    public void setEnergyConsumed(Double energyConsumed) {
        this.energyConsumed = energyConsumed;
    }

    public Double getChargingCost() {
        return chargingCost;
    }

    public void setChargingCost(Double chargingCost) {
        this.chargingCost = chargingCost;
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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
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

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
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

    public String getConnectorType() {
        return connectorType;
    }

    public void setConnectorType(String connectorType) {
        this.connectorType = connectorType;
    }

    public Double getPowerRating() {
        return powerRating;
    }

    public void setPowerRating(Double powerRating) {
        this.powerRating = powerRating;
    }

    public String getStationQrCode() {
        return stationQrCode;
    }

    public void setStationQrCode(String stationQrCode) {
        this.stationQrCode = stationQrCode;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }

    public Long getDurationMinutes() {
        if (startTime != null && endTime != null) {
            return Math.max(1L, Duration.between(startTime, endTime).toMinutes());
        }
        return 0L;
    }
}
