package com.voltloop.model;

public class RecommendationRequest {
    private Integer vehicleId;
    private String qrIdentifier;
    private Integer waitingMinutes = 0;
    private Double targetBattery = 80.0; // Standard 80% SoC recommendation threshold

    public RecommendationRequest() {
    }

    public RecommendationRequest(String qrIdentifier) {
        this.qrIdentifier = qrIdentifier;
    }

    public RecommendationRequest(String qrIdentifier, Integer waitingMinutes, Double targetBattery) {
        this.qrIdentifier = qrIdentifier;
        this.waitingMinutes = waitingMinutes != null ? waitingMinutes : 0;
        this.targetBattery = targetBattery != null ? targetBattery : 80.0;
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

    public Integer getWaitingMinutes() {
        return waitingMinutes;
    }

    public void setWaitingMinutes(Integer waitingMinutes) {
        this.waitingMinutes = waitingMinutes != null ? waitingMinutes : 0;
    }

    // Alias for waitingTimeMinutes
    public Integer getWaitingTimeMinutes() {
        return waitingMinutes;
    }

    public void setWaitingTimeMinutes(Integer waitingTimeMinutes) {
        this.waitingMinutes = waitingTimeMinutes != null ? waitingTimeMinutes : 0;
    }

    public Double getTargetBattery() {
        return targetBattery;
    }

    public void setTargetBattery(Double targetBattery) {
        this.targetBattery = targetBattery != null ? targetBattery : 80.0;
    }

    // Alias for targetBatteryPercentage
    public Double getTargetBatteryPercentage() {
        return targetBattery;
    }

    public void setTargetBatteryPercentage(Double targetBatteryPercentage) {
        this.targetBattery = targetBatteryPercentage != null ? targetBatteryPercentage : 80.0;
    }
}
