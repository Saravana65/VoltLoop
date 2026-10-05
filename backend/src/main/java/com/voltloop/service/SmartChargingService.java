package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ConflictException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.model.*;
import com.voltloop.repository.ChargingReservationRepository;
import com.voltloop.repository.ChargingSessionRepository;
import com.voltloop.repository.ChargingStationRepository;
import com.voltloop.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Smart Charging Service orchestrating the complete QR-to-Charging workflow,
 * priority scoring, conflict detection, and transactional state mutations.
 */
@Service
public class SmartChargingService {

    private static final Logger logger = LoggerFactory.getLogger(SmartChargingService.class);

    private final VehicleRepository vehicleRepository;
    private final ChargingStationRepository stationRepository;
    private final ChargingReservationRepository reservationRepository;
    private final ChargingSessionRepository sessionRepository;
    private final SmartAllocationEngine allocationEngine;
    private final DataSource dataSource;

    @Value("${charging.rate-per-kwh:15.00}")
    private double ratePerKwh;

    public SmartChargingService(VehicleRepository vehicleRepository,
                                ChargingStationRepository stationRepository,
                                ChargingReservationRepository reservationRepository,
                                ChargingSessionRepository sessionRepository,
                                SmartAllocationEngine allocationEngine,
                                DataSource dataSource) {
        this.vehicleRepository = vehicleRepository;
        this.stationRepository = stationRepository;
        this.reservationRepository = reservationRepository;
        this.sessionRepository = sessionRepository;
        this.allocationEngine = allocationEngine;
        this.dataSource = dataSource;
    }

    private Vehicle resolveVehicle(String qrIdentifier, Integer vehicleId) {
        if (qrIdentifier != null && !qrIdentifier.trim().isEmpty()) {
            return vehicleRepository.findVehicleByQrIdentifier(qrIdentifier.trim().toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with QR identifier: " + qrIdentifier));
        } else if (vehicleId != null) {
            return vehicleRepository.getVehicleById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));
        } else {
            throw new BadRequestException("Either QR identifier or vehicle ID is required.");
        }
    }

    /**
     * Intelligent Station Recommendation Workflow.
     * Evaluates EV eligibility, calculates priority, filters compatible bays,
     * detects conflicts, and recommends the optimal station.
     */
    public RecommendationResponse recommendStation(RecommendationRequest request) {
        Vehicle vehicle = resolveVehicle(request.getQrIdentifier(), request.getVehicleId());

        if ("INACTIVE".equalsIgnoreCase(vehicle.getStatus())) {
            throw new BadRequestException("Vehicle is currently marked INACTIVE. Cannot allocate charging.");
        }

        if ("CHARGING".equalsIgnoreCase(vehicle.getStatus())) {
            throw new ConflictException("Vehicle with registration '" + vehicle.getRegistrationNo() + "' is already actively charging.");
        }

        double targetBattery = request.getTargetBattery() != null ? request.getTargetBattery() : 80.0;
        int waitingMinutes = request.getWaitingMinutes() != null ? request.getWaitingMinutes() : 0;

        SmartAllocationEngine.PriorityResult priority = allocationEngine.calculatePriority(vehicle.getCurrentBattery(), waitingMinutes);

        // Fetch stations and filter available and compatible
        List<ChargingStation> allStations = stationRepository.getAllStations();
        List<ChargingStation> eligibleStations = allocationEngine.filterCompatibleStations(vehicle, allStations);

        // Further filter out any station currently occupied by an active session
        List<ChargingSession> activeSessions = sessionRepository.getActiveChargingSessions();
        List<Integer> occupiedStationIds = activeSessions.stream()
                .map(ChargingSession::getStationId)
                .collect(Collectors.toList());

        List<ChargingStation> readyStations = eligibleStations.stream()
                .filter(s -> !occupiedStationIds.contains(s.getStationId()))
                .collect(Collectors.toList());

        Optional<ChargingStation> bestStationOpt = allocationEngine.selectBestStation(vehicle, readyStations, targetBattery);

        double requiredKwh = allocationEngine.calculateRequiredEnergy(vehicle.getBatteryCapacity(), vehicle.getCurrentBattery(), targetBattery);
        double estimatedCost = Math.round(requiredKwh * ratePerKwh * 100.0) / 100.0;

        RecommendationResponse response = new RecommendationResponse();
        response.setVehicleId(vehicle.getVehicleId());
        response.setRegistrationNo(vehicle.getRegistrationNo());
        response.setQrIdentifier(vehicle.getQrIdentifier());
        response.setVehicleType(vehicle.getVehicleType());
        response.setBatteryCapacity(vehicle.getBatteryCapacity());
        response.setCurrentBattery(vehicle.getCurrentBattery());
        response.setTargetBattery(targetBattery);
        response.setPriorityScore(priority.getScore());
        response.setUrgencyLevel(priority.getUrgencyLevel());
        response.setRequiredEnergyKwh(requiredKwh);
        response.setEstimatedCost(estimatedCost);
        response.setEligibleStations(readyStations);

        if (bestStationOpt.isPresent()) {
            ChargingStation station = bestStationOpt.get();
            int minutes = allocationEngine.estimateChargingMinutes(requiredKwh, station.getPowerRating());
            response.setRecommendedStation(station);
            response.setEstimatedChargingMinutes(minutes);
            response.setEstimatedChargingHours(Math.round((minutes / 60.0) * 100.0) / 100.0);
            response.setReason(allocationEngine.generateRecommendationReason(vehicle, station, requiredKwh, minutes, priority));
        } else {
            response.setRecommendedStation(null);
            response.setEstimatedChargingMinutes(0);
            response.setEstimatedChargingHours(0.0);
            response.setReason("No compatible charging stations are currently AVAILABLE. Please wait or make a future reservation.");
        }

        return response;
    }

    /**
     * Smart Reservation Booking Workflow with Conflict Detection.
     * Uses explicit JDBC transactions: setAutoCommit(false), commit(), rollback().
     */
    public SmartReservationResponse createSmartReservation(SmartReservationRequest request) {
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new BadRequestException("Start time and end time are required.");
        }
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be strictly after start time.");
        }

        Vehicle vehicle = resolveVehicle(request.getQrIdentifier(), request.getVehicleId());

        if ("INACTIVE".equalsIgnoreCase(vehicle.getStatus())) {
            throw new BadRequestException("Cannot create reservation for an INACTIVE vehicle.");
        }

        ChargingStation assignedStation;
        if (request.getStationId() != null) {
            assignedStation = stationRepository.getStationById(request.getStationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Station not found with ID: " + request.getStationId()));

            if (!allocationEngine.isConnectorCompatible(vehicle.getVehicleType(), assignedStation.getConnectorType())) {
                throw new BadRequestException(String.format("Station connector '%s' is not compatible with vehicle '%s'.",
                        assignedStation.getConnectorType(), vehicle.getVehicleType()));
            }
        } else {
            // Automatically assign optimal available station
            RecommendationResponse rec = recommendStation(new RecommendationRequest(vehicle.getQrIdentifier()));
            if (rec.getRecommendedStation() == null) {
                throw new BadRequestException("No eligible compatible charging stations currently available for assignment.");
            }
            assignedStation = rec.getRecommendedStation();
        }

        // Slot Conflict Detection: newStart < existingEnd AND newEnd > existingStart
        List<ChargingReservation> conflicts = reservationRepository.findOverlappingReservations(
                assignedStation.getStationId(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new ConflictException(String.format("Reservation conflict: Station '%s' is already booked between %s and %s.",
                    assignedStation.getStationName(),
                    conflicts.get(0).getStartTime(),
                    conflicts.get(0).getEndTime()));
        }

        SmartAllocationEngine.PriorityResult priority = allocationEngine.calculatePriority(vehicle.getCurrentBattery(), 0);
        double requiredKwh = allocationEngine.calculateRequiredEnergy(vehicle.getBatteryCapacity(), vehicle.getCurrentBattery(), 80.0);
        int estMinutes = allocationEngine.estimateChargingMinutes(requiredKwh, assignedStation.getPowerRating());

        // Execute Reservation Creation using Pure JDBC Transaction
        int newReservationId;
        String insertSql = "INSERT INTO charging_reservations (vehicle_id, station_id, start_time, end_time, status) " +
                "VALUES (?, ?, ?, ?, 'RESERVED')";

        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false); // Begin JDBC transaction
            try (PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, vehicle.getVehicleId());
                ps.setInt(2, assignedStation.getStationId());
                ps.setTimestamp(3, Timestamp.valueOf(request.getStartTime()));
                ps.setTimestamp(4, Timestamp.valueOf(request.getEndTime()));
                ps.executeUpdate();

                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        newReservationId = rs.getInt(1);
                    } else {
                        throw new SQLException("Failed to retrieve generated reservation ID.");
                    }
                }

                conn.commit(); // Commit JDBC transaction
                logger.info("JDBC Transaction committed: Created reservation #{}", newReservationId);
            } catch (Exception ex) {
                conn.rollback(); // Rollback JDBC transaction
                logger.error("JDBC Transaction rolled back during reservation creation", ex);
                throw new RuntimeException("Database transaction failed during reservation creation: " + ex.getMessage(), ex);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }

        SmartReservationResponse response = new SmartReservationResponse();
        response.setReservationId(newReservationId);
        response.setVehicle(vehicle);
        response.setStation(assignedStation);
        response.setStartTime(request.getStartTime());
        response.setEndTime(request.getEndTime());
        response.setPriorityScore(priority.getScore());
        response.setUrgencyLevel(priority.getUrgencyLevel());
        response.setEstimatedChargingMinutes(estMinutes);
        response.setStatus("RESERVED");
        response.setMessage("Charging slot reserved successfully.");
        return response;
    }

    /**
     * Start Charging Workflow via QR Scan.
     * Transactionally creates charging session, sets vehicle to CHARGING, and station to OCCUPIED.
     * Uses explicit JDBC transactions: setAutoCommit(false), commit(), rollback().
     */
    public ChargingSession startChargingByQr(StartChargingRequest request) {
        Vehicle vehicle = resolveVehicle(request.getQrIdentifier(), request.getVehicleId());

        if ("CHARGING".equalsIgnoreCase(vehicle.getStatus())) {
            throw new ConflictException("Vehicle with registration '" + vehicle.getRegistrationNo() + "' is already actively charging.");
        }

        Optional<ChargingSession> existingActiveSession = sessionRepository.findActiveSessionByVehicleId(vehicle.getVehicleId());
        if (existingActiveSession.isPresent()) {
            throw new ConflictException("An active charging session (#" + existingActiveSession.get().getSessionId() + ") already exists for this vehicle.");
        }

        ChargingStation targetStation;
        if (request.getStationId() != null) {
            targetStation = stationRepository.getStationById(request.getStationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Station not found with ID: " + request.getStationId()));
            if (!allocationEngine.isConnectorCompatible(vehicle.getVehicleType(), targetStation.getConnectorType())) {
                throw new BadRequestException(String.format("Station connector '%s' is not compatible with vehicle '%s'.",
                        targetStation.getConnectorType(), vehicle.getVehicleType()));
            }
        } else {
            RecommendationResponse rec = recommendStation(new RecommendationRequest(vehicle.getQrIdentifier()));
            if (rec.getRecommendedStation() == null) {
                throw new BadRequestException("No compatible charging station is currently AVAILABLE.");
            }
            targetStation = rec.getRecommendedStation();
        }

        if (!"AVAILABLE".equalsIgnoreCase(targetStation.getStatus())) {
            throw new ConflictException("Station '" + targetStation.getStationName() + "' is currently " + targetStation.getStatus() + ".");
        }

        LocalDateTime startTime = LocalDateTime.now();
        int newSessionId;

        // Atomic JDBC Transaction: Insert Session + Update Vehicle + Update Station
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false); // Begin transaction
            try {
                // 1. Insert charging session
                String insertSessionSql = "INSERT INTO charging_sessions (vehicle_id, station_id, reservation_id, " +
                        "start_time, initial_battery, energy_consumed, charging_cost, status) " +
                        "VALUES (?, ?, NULL, ?, ?, 0.00, 0.00, 'ACTIVE')";
                try (PreparedStatement ps = conn.prepareStatement(insertSessionSql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, vehicle.getVehicleId());
                    ps.setInt(2, targetStation.getStationId());
                    ps.setTimestamp(3, Timestamp.valueOf(startTime));
                    ps.setDouble(4, vehicle.getCurrentBattery());
                    ps.executeUpdate();

                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            newSessionId = rs.getInt(1);
                        } else {
                            throw new SQLException("Failed to obtain generated session ID.");
                        }
                    }
                }

                // 2. Update vehicle status to CHARGING
                String updateVehicleSql = "UPDATE vehicles SET status = 'CHARGING' WHERE vehicle_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateVehicleSql)) {
                    ps.setInt(1, vehicle.getVehicleId());
                    ps.executeUpdate();
                }

                // 3. Update station status to OCCUPIED
                String updateStationSql = "UPDATE charging_stations SET status = 'OCCUPIED' WHERE station_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateStationSql)) {
                    ps.setInt(1, targetStation.getStationId());
                    ps.executeUpdate();
                }

                conn.commit(); // Commit transaction
                logger.info("JDBC Transaction committed: Started session #{} for vehicle {}", newSessionId, vehicle.getRegistrationNo());
            } catch (Exception e) {
                conn.rollback(); // Rollback transaction
                logger.error("JDBC Transaction rolled back during charging start", e);
                throw new RuntimeException("Database transaction failed: " + e.getMessage(), e);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }

        ChargingSession session = new ChargingSession();
        session.setSessionId(newSessionId);
        session.setVehicleId(vehicle.getVehicleId());
        session.setStationId(targetStation.getStationId());
        session.setStartTime(startTime);
        session.setInitialBattery(vehicle.getCurrentBattery());
        session.setEnergyConsumed(0.00);
        session.setChargingCost(0.00);
        session.setStatus("ACTIVE");
        session.setRegistrationNo(vehicle.getRegistrationNo());
        session.setQrIdentifier(vehicle.getQrIdentifier());
        session.setVehicleType(vehicle.getVehicleType());
        session.setStationName(targetStation.getStationName());
        session.setStationLocation(targetStation.getLocation());

        return session;
    }

    /**
     * Complete Charging Workflow.
     * Calculates energy delivered, evaluates cost using configurable ratePerKWh,
     * resets vehicle to ACTIVE with new battery, and marks station as AVAILABLE.
     * Uses explicit JDBC transactions: setAutoCommit(false), commit(), rollback().
     */
    public ChargingSession completeCharging(CompleteChargingRequest request) {
        if (request.getSessionId() == null) {
            throw new BadRequestException("Session ID is required.");
        }

        ChargingSession session = sessionRepository.getSessionById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with ID: " + request.getSessionId()));

        if (!"ACTIVE".equalsIgnoreCase(session.getStatus())) {
            throw new BadRequestException("Session #" + request.getSessionId() + " is already marked " + session.getStatus() + ".");
        }

        Vehicle vehicle = vehicleRepository.getVehicleById(session.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + session.getVehicleId()));

        double finalBattery = request.getFinalBattery() != null ? request.getFinalBattery() : 100.00;
        if (finalBattery < 0.0 || finalBattery > 100.0) {
            throw new BadRequestException("Final battery percentage must be between 0 and 100%.");
        }

        // Energy consumed = Battery Capacity * (Final % - Initial %) / 100
        double batteryGain = Math.max(0.0, finalBattery - session.getInitialBattery());
        double energyConsumed = Math.round(((vehicle.getBatteryCapacity() * batteryGain) / 100.0) * 100.0) / 100.0;
        double chargingCost = Math.round((energyConsumed * ratePerKwh) * 100.0) / 100.0;
        LocalDateTime endTime = LocalDateTime.now();

        // Atomic JDBC Transaction: Complete Session + Update Vehicle + Release Station
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false); // Begin transaction
            try {
                // 1. Update session to COMPLETED
                String updateSessionSql = "UPDATE charging_sessions SET end_time = ?, final_battery = ?, " +
                        "energy_consumed = ?, charging_cost = ?, status = 'COMPLETED' WHERE session_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateSessionSql)) {
                    ps.setTimestamp(1, Timestamp.valueOf(endTime));
                    ps.setDouble(2, finalBattery);
                    ps.setDouble(3, energyConsumed);
                    ps.setDouble(4, chargingCost);
                    ps.setInt(5, session.getSessionId());
                    ps.executeUpdate();
                }

                // 2. Update vehicle battery & reset status to ACTIVE
                String updateVehicleSql = "UPDATE vehicles SET current_battery = ?, status = 'ACTIVE' WHERE vehicle_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateVehicleSql)) {
                    ps.setDouble(1, finalBattery);
                    ps.setInt(2, vehicle.getVehicleId());
                    ps.executeUpdate();
                }

                // 3. Release station status to AVAILABLE
                String updateStationSql = "UPDATE charging_stations SET status = 'AVAILABLE' WHERE station_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateStationSql)) {
                    ps.setInt(1, session.getStationId());
                    ps.executeUpdate();
                }

                conn.commit(); // Commit transaction
                logger.info("JDBC Transaction committed: Completed session #{} for vehicle {}", session.getSessionId(), vehicle.getRegistrationNo());
            } catch (Exception ex) {
                conn.rollback(); // Rollback transaction
                logger.error("JDBC Transaction rolled back during session completion", ex);
                throw new RuntimeException("Database transaction failed during session completion: " + ex.getMessage(), ex);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }

        session.setEndTime(endTime);
        session.setFinalBattery(finalBattery);
        session.setEnergyConsumed(energyConsumed);
        session.setChargingCost(chargingCost);
        session.setStatus("COMPLETED");

        return session;
    }

    public List<ChargingSession> getChargingHistory(int vehicleId) {
        if (vehicleRepository.getVehicleById(vehicleId).isEmpty()) {
            throw new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId);
        }
        return sessionRepository.getChargingHistoryByVehicle(vehicleId);
    }

    public List<ChargingSession> getActiveSessions() {
        return sessionRepository.getActiveChargingSessions();
    }

    public RecommendationResponse getRecommendedStationForVehicle(int vehicleId) {
        Vehicle vehicle = vehicleRepository.getVehicleById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));
        return recommendStation(new RecommendationRequest(vehicle.getQrIdentifier()));
    }
}
