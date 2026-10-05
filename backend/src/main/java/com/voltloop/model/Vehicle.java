package com.voltloop.model;

import java.time.LocalDateTime;

public class Vehicle {
    private Integer vehicleId;
    private Integer userId;
    private String vehicleType;
    private String registrationNo;
    private Double batteryCapacity;
    private Double currentBattery;
    private String qrIdentifier;
    private String status; // ACTIVE, INACTIVE, CHARGING
    private LocalDateTime createdAt;

    // Optional enrichment fields from JOIN with users
    private String ownerName;
    private String ownerEmail;

    public Vehicle() {
    }

    public Vehicle(Integer vehicleId, Integer userId, String vehicleType, String registrationNo,
                   Double batteryCapacity, Double currentBattery, String qrIdentifier,
                   String status, LocalDateTime createdAt) {
        this.vehicleId = vehicleId;
        this.userId = userId;
        this.vehicleType = vehicleType;
        this.registrationNo = registrationNo;
        this.batteryCapacity = batteryCapacity;
        this.currentBattery = currentBattery;
        this.qrIdentifier = qrIdentifier;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getRegistrationNo() {
        return registrationNo;
    }

    public void setRegistrationNo(String registrationNo) {
        this.registrationNo = registrationNo;
    }

    public Double getBatteryCapacity() {
        return batteryCapacity;
    }

    public void setBatteryCapacity(Double batteryCapacity) {
        this.batteryCapacity = batteryCapacity;
    }

    public Double getCurrentBattery() {
        return currentBattery;
    }

    public void setCurrentBattery(Double currentBattery) {
        this.currentBattery = currentBattery;
    }

    public String getQrIdentifier() {
        return qrIdentifier;
    }

    public void setQrIdentifier(String qrIdentifier) {
        this.qrIdentifier = qrIdentifier;
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

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }
}
