package com.voltloop.model;

public class StartChargingRequest {
    private Integer vehicleId;
    private String qrIdentifier;
    private Integer stationId; // Optional: If omitted, automatically uses the optimal station

    public StartChargingRequest() {
    }

    public StartChargingRequest(String qrIdentifier, Integer stationId) {
        this.qrIdentifier = qrIdentifier;
        this.stationId = stationId;
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
}
