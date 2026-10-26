package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ConflictException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.model.*;
import com.voltloop.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    private final VehicleRepository vehicleRepository;
    private final ChargingStationRepository stationRepository;
    private final ChargingReservationRepository reservationRepository;
    private final ChargingSessionRepository sessionRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SmartAllocationEngine allocationEngine;
    private final SmartChargingService smartChargingService;

    @Value("${charging.rate-per-kwh:15.00}")
    private double ratePerKwh;

    public CustomerService(VehicleRepository vehicleRepository,
                           ChargingStationRepository stationRepository,
                           ChargingReservationRepository reservationRepository,
                           ChargingSessionRepository sessionRepository,
                           PaymentRepository paymentRepository,
                           UserRepository userRepository,
                           SmartAllocationEngine allocationEngine,
                           SmartChargingService smartChargingService) {
        this.vehicleRepository = vehicleRepository;
        this.stationRepository = stationRepository;
        this.reservationRepository = reservationRepository;
        this.sessionRepository = sessionRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.allocationEngine = allocationEngine;
        this.smartChargingService = smartChargingService;
    }

    public Map<String, Object> getCustomerDashboard(int userId) {
        List<Vehicle> myVehicles = vehicleRepository.getVehiclesByUserId(userId);
        Optional<ChargingSession> activeSession = sessionRepository.findActiveSessionByUserId(userId);
        List<ChargingSession> mySessions = sessionRepository.getSessionsByUserId(userId);
        List<ChargingReservation> myBookings = reservationRepository.getReservationsByUserId(userId);
        List<Payment> myPayments = paymentRepository.getPaymentsByUserId(userId);
        User customerUser = userRepository.getUserById(userId).orElse(null);

        double totalEnergy = mySessions.stream()
                .filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus()))
                .mapToDouble(s -> s.getEnergyConsumed() != null ? s.getEnergyConsumed() : 0.0)
                .sum();

        double totalSpend = myPayments.stream()
                .filter(p -> "SUCCESSFUL".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("customer", customerUser);
        dashboard.put("vehicles", myVehicles);
        dashboard.put("activeSession", activeSession.orElse(null));
        dashboard.put("recentSessions", mySessions.stream().limit(5).collect(Collectors.toList()));
        dashboard.put("upcomingBookings", myBookings.stream().filter(b -> "RESERVED".equalsIgnoreCase(b.getStatus())).collect(Collectors.toList()));
        dashboard.put("totalEnergyConsumed", Math.round(totalEnergy * 100.0) / 100.0);
        dashboard.put("totalSpend", Math.round(totalSpend * 100.0) / 100.0);
        dashboard.put("ratePerKwh", ratePerKwh);

        return dashboard;
    }

    public User getCustomerProfile(int userId) {
        return userRepository.getUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    public User updateCustomerProfile(int userId, String name, String phone) {
        userRepository.updateProfile(userId, name, phone);
        return getCustomerProfile(userId);
    }

    public List<ChargingSession> getCustomerSessions(int userId) {
        return sessionRepository.getSessionsByUserId(userId);
    }

    public StationQRResolutionResponse resolveStationByQr(int userId, String stationIdentifier) {
        if (stationIdentifier == null || stationIdentifier.trim().isEmpty()) {
            throw new BadRequestException("Station QR identifier or code is required.");
        }

        String cleanIdentifier = stationIdentifier.trim();
        Optional<ChargingStation> stationOpt = stationRepository.findStationByQrCode(cleanIdentifier);
        if (stationOpt.isEmpty()) {
            // Check if numeric ID was provided as fallback
            try {
                int id = Integer.parseInt(cleanIdentifier);
                stationOpt = stationRepository.getStationById(id);
            } catch (NumberFormatException ignored) {}
        }

        if (stationOpt.isEmpty()) {
            throw new ResourceNotFoundException("No campus charging station found matching QR / code: '" + cleanIdentifier + "'.");
        }

        ChargingStation station = stationOpt.get();
        List<Vehicle> customerVehicles = vehicleRepository.getVehiclesByUserId(userId);

        boolean available = "AVAILABLE".equalsIgnoreCase(station.getStatus());
        boolean hasCompatibleVehicle = customerVehicles.stream()
                .anyMatch(v -> allocationEngine.isConnectorCompatible(v.getVehicleType(), station.getConnectorType()));

        String message;
        if (!available) {
            message = "Station '" + station.getStationName() + "' is currently " + station.getStatus() + ".";
        } else if (customerVehicles.isEmpty()) {
            message = "Please register an EV first to charge at " + station.getStationName() + ".";
        } else if (!hasCompatibleVehicle) {
            message = "None of your registered vehicles support the " + station.getConnectorType() + " connector used by " + station.getStationName() + ".";
        } else {
            message = "Station " + station.getStationName() + " is ready for charging (" + station.getPowerRating() + " kW " + station.getConnectorType() + ").";
        }

        return new StationQRResolutionResponse(station, customerVehicles, available, hasCompatibleVehicle, ratePerKwh, message);
    }

    public List<Vehicle> getCustomerVehicles(int userId) {
        return vehicleRepository.getVehiclesByUserId(userId);
    }

    @Transactional
    public Vehicle addCustomerVehicle(int userId, Vehicle vehicle) {
        if (vehicle == null) {
            throw new BadRequestException("Vehicle details are required.");
        }
        if (vehicle.getRegistrationNo() == null || vehicle.getRegistrationNo().trim().isEmpty()) {
            throw new BadRequestException("Registration number is required.");
        }

        String regNo = vehicle.getRegistrationNo().trim().toUpperCase();
        if (vehicleRepository.existsByRegistrationNo(regNo)) {
            throw new ConflictException("Vehicle with registration '" + regNo + "' already exists.");
        }

        String qr = "VL-EV-" + regNo.replaceAll("[^A-Z0-9]", "");
        if (vehicleRepository.existsByQrIdentifier(qr)) {
            qr = "VL-EV-" + System.currentTimeMillis() % 100000;
        }

        vehicle.setUserId(userId);
        vehicle.setRegistrationNo(regNo);
        vehicle.setQrIdentifier(qr);
        if (vehicle.getVehicleType() == null || vehicle.getVehicleType().trim().isEmpty()) {
            vehicle.setVehicleType("4-Wheeler (Compact EV)");
        }
        if (vehicle.getBatteryCapacity() == null || vehicle.getBatteryCapacity() <= 0) {
            vehicle.setBatteryCapacity(35.0);
        }
        if (vehicle.getCurrentBattery() == null) {
            vehicle.setCurrentBattery(100.0);
        }
        vehicle.setStatus("ACTIVE");

        return vehicleRepository.registerVehicle(vehicle);
    }

    @Transactional
    public ChargingSession startCustomerCharging(int userId, int vehicleId, int stationId) {
        Vehicle vehicle = vehicleRepository.getVehicleById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        if (vehicle.getUserId() != userId) {
            throw new BadRequestException("Access denied: You can only initiate charging for your own vehicle.");
        }

        StartChargingRequest startReq = new StartChargingRequest(vehicle.getQrIdentifier(), stationId);
        startReq.setVehicleId(vehicleId);

        return smartChargingService.startChargingByQr(startReq);
    }

    @Transactional
    public ChargingSession completeCustomerCharging(int userId, int sessionId, double finalBattery) {
        ChargingSession session = sessionRepository.getSessionById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with ID: " + sessionId));

        if (session.getUserId() != null && session.getUserId() != userId) {
            throw new BadRequestException("Access denied: You can only complete your own charging session.");
        }

        CompleteChargingRequest compReq = new CompleteChargingRequest(sessionId, finalBattery);
        ChargingSession completed = smartChargingService.completeCharging(compReq);

        // Auto-create pending payment for session review & checkout
        try {
            PaymentInitiateRequest payReq = new PaymentInitiateRequest(completed.getSessionId(), null, completed.getChargingCost(), "SIMULATED_UPI");
            paymentRepository.createPayment(new Payment(
                    null, userId, completed.getSessionId(), null, completed.getStationId(),
                    completed.getChargingCost(), "INR", "SIMULATED_UPI",
                    "TXN-VL-" + System.currentTimeMillis(), "PENDING", true, LocalDateTime.now(), null
            ));
        } catch (Exception ex) {
            logger.warn("Pending payment auto-creation notice: {}", ex.getMessage());
        }

        return completed;
    }

    @Transactional
    public SmartReservationResponse createCustomerBooking(int userId, SmartReservationRequest request) {
        if (request == null || request.getVehicleId() == null || request.getStationId() == null) {
            throw new BadRequestException("Vehicle ID, station ID, and reservation times are required.");
        }

        Vehicle vehicle = vehicleRepository.getVehicleById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + request.getVehicleId()));

        if (vehicle.getUserId() != userId) {
            throw new BadRequestException("Access denied: You can only book reservations for your own vehicle.");
        }

        return smartChargingService.createSmartReservation(request);
    }

    public boolean cancelCustomerBooking(int userId, int reservationId) {
        ChargingReservation res = reservationRepository.getReservationById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + reservationId));

        if (res.getUserId() != null && res.getUserId() != userId) {
            throw new BadRequestException("Access denied: You can only cancel your own reservations.");
        }

        return reservationRepository.cancelReservation(reservationId);
    }
}
