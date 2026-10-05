package com.voltloop.model;

import java.time.LocalDateTime;

public class ChargingStation {
    private Integer stationId;
    private String stationName;
    private String location;
    private String chargerType;
    private Double powerRating;
    private String connectorType;
    private String status; // AVAILABLE, OCCUPIED, MAINTENANCE
    private LocalDateTime createdAt;

    public ChargingStation() {
    }

    public ChargingStation(Integer stationId, String stationName, String location, String chargerType,
                           Double powerRating, String connectorType, String status, LocalDateTime createdAt) {
        this.stationId = stationId;
        this.stationName = stationName;
        this.location = location;
        this.chargerType = chargerType;
        this.powerRating = powerRating;
        this.connectorType = connectorType;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Integer getStationId() {
        return stationId;
    }

    public void setStationId(Integer stationId) {
        this.stationId = stationId;
    }

    public String getStationName() {
        return stationName;
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getChargerType() {
        return chargerType;
    }

    public void setChargerType(String chargerType) {
        this.chargerType = chargerType;
    }

    public Double getPowerRating() {
        return powerRating;
    }

    public void setPowerRating(Double powerRating) {
        this.powerRating = powerRating;
    }

    public String getConnectorType() {
        return connectorType;
    }

    public void setConnectorType(String connectorType) {
        this.connectorType = connectorType;
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
}
