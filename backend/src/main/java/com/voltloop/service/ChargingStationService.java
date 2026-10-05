package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ConflictException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.model.ChargingStation;
import com.voltloop.repository.ChargingStationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChargingStationService {

    private final ChargingStationRepository stationRepository;

    public ChargingStationService(ChargingStationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    public ChargingStation createStation(ChargingStation station) {
        if (station.getStationName() == null || station.getStationName().trim().isEmpty()) {
            throw new BadRequestException("Station name is required.");
        }
        if (station.getLocation() == null || station.getLocation().trim().isEmpty()) {
            throw new BadRequestException("Station location is required.");
        }
        if (station.getChargerType() == null || station.getChargerType().trim().isEmpty()) {
            throw new BadRequestException("Charger type is required.");
        }
        if (station.getConnectorType() == null || station.getConnectorType().trim().isEmpty()) {
            throw new BadRequestException("Connector type is required.");
        }
        if (station.getPowerRating() == null || station.getPowerRating() <= 0) {
            throw new BadRequestException("Power rating must be greater than 0 kW.");
        }

        String name = station.getStationName().trim();
        if (stationRepository.existsByName(name)) {
            throw new ConflictException("Charging station with name '" + name + "' already exists.");
        }

        station.setStationName(name);
        station.setLocation(station.getLocation().trim());
        station.setChargerType(station.getChargerType().trim());
        station.setConnectorType(station.getConnectorType().trim());

        if (station.getStatus() == null || station.getStatus().trim().isEmpty()) {
            station.setStatus("AVAILABLE");
        } else {
            String status = station.getStatus().trim().toUpperCase();
            if (!status.equals("AVAILABLE") && !status.equals("OCCUPIED") && !status.equals("MAINTENANCE")) {
                throw new BadRequestException("Status must be AVAILABLE, OCCUPIED, or MAINTENANCE.");
            }
            station.setStatus(status);
        }

        return stationRepository.createStation(station);
    }

    public List<ChargingStation> getAllStations() {
        return stationRepository.getAllStations();
    }

    public List<ChargingStation> getAvailableStations() {
        return stationRepository.getAvailableStations();
    }

    public ChargingStation getStationById(int stationId) {
        return stationRepository.getStationById(stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Charging station not found with ID: " + stationId));
    }

    public void updateStationStatus(int stationId, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new BadRequestException("Station status cannot be empty.");
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!normalizedStatus.equals("AVAILABLE") && !normalizedStatus.equals("OCCUPIED") && !normalizedStatus.equals("MAINTENANCE")) {
            throw new BadRequestException("Invalid status. Must be AVAILABLE, OCCUPIED, or MAINTENANCE.");
        }
        getStationById(stationId); // Throws 404 if not found
        stationRepository.updateStationStatus(stationId, normalizedStatus);
    }
}
