package com.voltloop.model;

import java.util.List;

public class StationQRResolutionResponse {
    private ChargingStation station;
    private List<Vehicle> customerVehicles;
    private Boolean stationAvailable;
    private Boolean connectorCompatible;
    private Double ratePerKwh;
    private String message;

    public StationQRResolutionResponse() {
    }

    public StationQRResolutionResponse(ChargingStation station, List<Vehicle> customerVehicles,
                                       Boolean stationAvailable, Boolean connectorCompatible,
                                       Double ratePerKwh, String message) {
        this.station = station;
        this.customerVehicles = customerVehicles;
        this.stationAvailable = stationAvailable;
        this.connectorCompatible = connectorCompatible;
        this.ratePerKwh = ratePerKwh;
        this.message = message;
    }

    public ChargingStation getStation() {
        return station;
    }

    public void setStation(ChargingStation station) {
        this.station = station;
    }

    public List<Vehicle> getCustomerVehicles() {
        return customerVehicles;
    }

    public void setCustomerVehicles(List<Vehicle> customerVehicles) {
        this.customerVehicles = customerVehicles;
    }

    public Boolean getStationAvailable() {
        return stationAvailable;
    }

    public void setStationAvailable(Boolean stationAvailable) {
        this.stationAvailable = stationAvailable;
    }

    public Boolean getConnectorCompatible() {
        return connectorCompatible;
    }

    public void setConnectorCompatible(Boolean connectorCompatible) {
        this.connectorCompatible = connectorCompatible;
    }

    public Double getRatePerKwh() {
        return ratePerKwh;
    }

    public void setRatePerKwh(Double ratePerKwh) {
        this.ratePerKwh = ratePerKwh;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isValid() {
        return station != null;
    }
}
