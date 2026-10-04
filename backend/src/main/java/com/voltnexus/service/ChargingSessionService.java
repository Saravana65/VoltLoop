package com.voltnexus.service;

import com.voltnexus.exception.BadRequestException;
import com.voltnexus.exception.ConflictException;
import com.voltnexus.exception.ResourceNotFoundException;
import com.voltnexus.model.ChargingSession;
import com.voltnexus.model.ChargingStation;
import com.voltnexus.model.Vehicle;
import com.voltnexus.repository.ChargingReservationRepository;
import com.voltnexus.repository.ChargingSessionRepository;
import com.voltnexus.repository.ChargingStationRepository;
import com.voltnexus.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ChargingSessionService {

    private final ChargingSessionRepository sessionRepository;
    private final VehicleRepository vehicleRepository;
    private final ChargingStationRepository stationRepository;
    private final ChargingReservationRepository reservationRepository;

    public ChargingSessionService(ChargingSessionRepository sessionRepository,
                                  VehicleRepository vehicleRepository,
                                  ChargingStationRepository stationRepository,
                                  ChargingReservationRepository reservationRepository) {
        this.sessionRepository = sessionRepository;
        this.vehicleRepository = vehicleRepository;
        this.stationRepository = stationRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public ChargingSession startSession(ChargingSession session) {
        if (session.getVehicleId() == null) {
            throw new BadRequestException("Vehicle ID is required to start a charging session.");
        }
        if (session.getStationId() == null) {
            throw new BadRequestException("Station ID is required to start a charging session.");
        }

        Vehicle vehicle = vehicleRepository.getVehicleById(session.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + session.getVehicleId()));

        ChargingStation station = stationRepository.getStationById(session.getStationId())
                .orElseThrow(() -> new ResourceNotFoundException("Charging Station not found with ID: " + session.getStationId()));

        // Validation Rule: A vehicle that is already charging should not start another charging session.
        if ("CHARGING".equalsIgnoreCase(vehicle.getStatus())) {
            throw new ConflictException("Vehicle with registration '" + vehicle.getRegistrationNo() + "' is already actively charging.");
        }

        Optional<ChargingSession> existingActiveSession = sessionRepository.findActiveSessionByVehicleId(vehicle.getVehicleId());
        if (existingActiveSession.isPresent()) {
            throw new ConflictException("An active charging session (#" + existingActiveSession.get().getSessionId() + ") already exists for this vehicle.");
        }

        if ("MAINTENANCE".equalsIgnoreCase(station.getStatus())) {
            throw new ConflictException("Charging station '" + station.getStationName() + "' is currently undergoing maintenance.");
        }

        // Default initial battery to the vehicle's current recorded battery if not specified
        if (session.getInitialBattery() == null) {
            session.setInitialBattery(vehicle.getCurrentBattery());
        }

        if (session.getInitialBattery() < 0.0 || session.getInitialBattery() > 100.0) {
            throw new BadRequestException("Initial battery percentage must be between 0 and 100%.");
        }

        if (session.getStartTime() == null) {
            session.setStartTime(LocalDateTime.now());
        }

        // Validate optional reservation
        if (session.getReservationId() != null) {
            if (reservationRepository.getReservationById(session.getReservationId()).isEmpty()) {
                throw new ResourceNotFoundException("Reservation not found with ID: " + session.getReservationId());
            }
        }

        // Start session in repository
        ChargingSession createdSession = sessionRepository.startChargingSession(session);

        // Update vehicle state to CHARGING
        vehicleRepository.updateVehicleStatus(vehicle.getVehicleId(), "CHARGING");

        // Update station state to OCCUPIED
        stationRepository.updateStationStatus(station.getStationId(), "OCCUPIED");

        createdSession.setRegistrationNo(vehicle.getRegistrationNo());
        createdSession.setQrIdentifier(vehicle.getQrIdentifier());
        createdSession.setStationName(station.getStationName());
        createdSession.setStationLocation(station.getLocation());

        return createdSession;
    }

    @Transactional
    public ChargingSession completeSession(int sessionId, Double finalBattery, Double energyConsumed, Double chargingCost) {
        ChargingSession session = sessionRepository.getSessionById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with ID: " + sessionId));

        if (!"ACTIVE".equalsIgnoreCase(session.getStatus())) {
            throw new BadRequestException("Session #" + sessionId + " is already marked as " + session.getStatus() + ".");
        }

        if (finalBattery == null) {
            finalBattery = 100.00; // Default full charge if not passed
        }
        if (finalBattery < 0.0 || finalBattery > 100.0) {
            throw new BadRequestException("Final battery percentage must be between 0 and 100%.");
        }
        if (energyConsumed == null || energyConsumed < 0.0) {
            // Rough estimate based on battery capacity if available
            Vehicle vehicle = vehicleRepository.getVehicleById(session.getVehicleId()).orElse(null);
            if (vehicle != null && finalBattery > session.getInitialBattery()) {
                double batteryDiff = (finalBattery - session.getInitialBattery()) / 100.0;
                energyConsumed = Math.round(batteryDiff * vehicle.getBatteryCapacity() * 100.0) / 100.0;
            } else {
                energyConsumed = 0.00;
            }
        }
        if (chargingCost == null || chargingCost < 0.0) {
            chargingCost = Math.round(energyConsumed * 15.00 * 100.0) / 100.0; // Flat ₹15 per kWh standard campus rate
        }

        LocalDateTime endTime = LocalDateTime.now();
        sessionRepository.completeChargingSession(sessionId, endTime, finalBattery, energyConsumed, chargingCost);

        // Reset vehicle to ACTIVE status with new battery percentage
        vehicleRepository.updateBatteryPercentage(session.getVehicleId(), finalBattery);
        vehicleRepository.updateVehicleStatus(session.getVehicleId(), "ACTIVE");

        // Release charging station back to AVAILABLE
        stationRepository.updateStationStatus(session.getStationId(), "AVAILABLE");

        session.setEndTime(endTime);
        session.setFinalBattery(finalBattery);
        session.setEnergyConsumed(energyConsumed);
        session.setChargingCost(chargingCost);
        session.setStatus("COMPLETED");

        return session;
    }

    public List<ChargingSession> getAllSessions() {
        return sessionRepository.getAllSessions();
    }

    public List<ChargingSession> getActiveSessions() {
        return sessionRepository.getActiveChargingSessions();
    }

    public List<ChargingSession> getSessionsByVehicleId(int vehicleId) {
        if (vehicleRepository.getVehicleById(vehicleId).isEmpty()) {
            throw new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId);
        }
        return sessionRepository.getChargingHistoryByVehicle(vehicleId);
    }

    public ChargingSession getSessionById(int sessionId) {
        return sessionRepository.getSessionById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with ID: " + sessionId));
    }
}
