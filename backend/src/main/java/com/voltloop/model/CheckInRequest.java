package com.voltloop.model;

/**
 * Request payload for Charging Station Check-In and Authorization.
 */
public class CheckInRequest {
    private String qrIdentifier;
    private Integer vehicleId;
    private Integer stationId;

    public CheckInRequest() {}

    public CheckInRequest(String qrIdentifier, Integer stationId) {
        this.qrIdentifier = qrIdentifier;
        this.stationId = stationId;
    }

    public String getQrIdentifier() {
        return qrIdentifier;
    }

    public void setQrIdentifier(String qrIdentifier) {
        this.qrIdentifier = qrIdentifier;
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
}
