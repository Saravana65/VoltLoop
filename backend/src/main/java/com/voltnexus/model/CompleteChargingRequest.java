package com.voltnexus.model;

public class CompleteChargingRequest {
    private Integer sessionId;
    private Double finalBattery = 100.00; // Defaults to 100% full charge

    public CompleteChargingRequest() {
    }

    public CompleteChargingRequest(Integer sessionId, Double finalBattery) {
        this.sessionId = sessionId;
        this.finalBattery = finalBattery != null ? finalBattery : 100.00;
    }

    public Integer getSessionId() {
        return sessionId;
    }

    public void setSessionId(Integer sessionId) {
        this.sessionId = sessionId;
    }

    public Double getFinalBattery() {
        return finalBattery;
    }

    public void setFinalBattery(Double finalBattery) {
        this.finalBattery = finalBattery != null ? finalBattery : 100.00;
    }

    public Double getEndBatteryPercentage() {
        return finalBattery;
    }

    public void setEndBatteryPercentage(Double endBatteryPercentage) {
        this.finalBattery = endBatteryPercentage != null ? endBatteryPercentage : 100.00;
    }
}
