package com.voltloop.model;

import java.util.List;

public class RecommendationResponse {
    private Integer vehicleId;
    private String registrationNo;
    private String qrIdentifier;
    private String vehicleType;
    private Double batteryCapacity;
    private Double currentBattery;
    private Double targetBattery;

    private Integer priorityScore;
    private String urgencyLevel; // VERY_HIGH, HIGH, MEDIUM, LOW

    private ChargingStation recommendedStation;
    private Double requiredEnergyKwh;
    private Double estimatedChargingHours;
    private Integer estimatedChargingMinutes;
    private Double estimatedCost;
    private String reason;

    private List<ChargingStation> eligibleStations;

    public RecommendationResponse() {
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
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

    public Double getTargetBattery() {
        return targetBattery;
    }

    public void setTargetBattery(Double targetBattery) {
        this.targetBattery = targetBattery;
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

    public ChargingStation getRecommendedStation() {
        return recommendedStation;
    }

    public void setRecommendedStation(ChargingStation recommendedStation) {
        this.recommendedStation = recommendedStation;
    }

    public Double getRequiredEnergyKwh() {
        return requiredEnergyKwh;
    }

    public void setRequiredEnergyKwh(Double requiredEnergyKwh) {
        this.requiredEnergyKwh = requiredEnergyKwh;
    }

    public Double getEstimatedChargingHours() {
        return estimatedChargingHours;
    }

    public void setEstimatedChargingHours(Double estimatedChargingHours) {
        this.estimatedChargingHours = estimatedChargingHours;
    }

    public Integer getEstimatedChargingMinutes() {
        return estimatedChargingMinutes;
    }

    public void setEstimatedChargingMinutes(Integer estimatedChargingMinutes) {
        this.estimatedChargingMinutes = estimatedChargingMinutes;
    }

    public Double getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(Double estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public List<ChargingStation> getEligibleStations() {
        return eligibleStations;
    }

    public void setEligibleStations(List<ChargingStation> eligibleStations) {
        this.eligibleStations = eligibleStations;
    }
}
