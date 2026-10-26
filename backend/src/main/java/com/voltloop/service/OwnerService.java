package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ForbiddenException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.model.ChargingSession;
import com.voltloop.model.ChargingStation;
import com.voltloop.model.Payment;
import com.voltloop.repository.ChargingSessionRepository;
import com.voltloop.repository.ChargingStationRepository;
import com.voltloop.repository.PaymentRepository;
import com.voltloop.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OwnerService {

    private final ChargingStationRepository stationRepository;
    private final ChargingSessionRepository sessionRepository;
    private final PaymentRepository paymentRepository;
    private final VehicleRepository vehicleRepository;

    public OwnerService(ChargingStationRepository stationRepository,
                        ChargingSessionRepository sessionRepository,
                        PaymentRepository paymentRepository,
                        VehicleRepository vehicleRepository) {
        this.stationRepository = stationRepository;
        this.sessionRepository = sessionRepository;
        this.paymentRepository = paymentRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public Map<String, Object> getOverview(int ownerId) {
        List<ChargingStation> ownerStations = stationRepository.getStationsByOwnerId(ownerId);
        if (ownerStations.isEmpty()) {
            // Fallback for primary demo: if owner has no explicitly assigned stations, show all campus stations
            ownerStations = stationRepository.getAllStations();
        }

        long availableCount = ownerStations.stream().filter(s -> "AVAILABLE".equalsIgnoreCase(s.getStatus())).count();
        long occupiedCount = ownerStations.stream().filter(s -> "OCCUPIED".equalsIgnoreCase(s.getStatus())).count();
        long maintenanceCount = ownerStations.stream().filter(s -> "MAINTENANCE".equalsIgnoreCase(s.getStatus())).count();

        List<ChargingSession> allOwnerSessions = sessionRepository.getSessionsByStationOwnerId(ownerId);
        if (allOwnerSessions.isEmpty()) {
            allOwnerSessions = sessionRepository.getAllSessions();
        }

        List<ChargingSession> activeSessions = allOwnerSessions.stream()
                .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        List<ChargingSession> completedSessions = allOwnerSessions.stream()
                .filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        double totalEnergy = completedSessions.stream()
                .mapToDouble(s -> s.getEnergyConsumed() != null ? s.getEnergyConsumed() : 0.0)
                .sum();

        double totalRevenue = paymentRepository.getVerifiedRevenueForOwner(ownerId);
        if (totalRevenue == 0.0) {
            totalRevenue = completedSessions.stream()
                    .mapToDouble(s -> s.getChargingCost() != null ? s.getChargingCost() : 0.0)
                    .sum();
        }

        double todayRevenue = paymentRepository.getTodayVerifiedRevenueForOwner(ownerId);

        List<ChargingSession> recentActivity = allOwnerSessions.stream().limit(10).collect(Collectors.toList());

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalVehicles", vehicleRepository.getAllVehicles().size());
        overview.put("totalStations", ownerStations.size());
        overview.put("availableStations", availableCount);
        overview.put("occupiedStations", occupiedCount);
        overview.put("maintenanceStations", maintenanceCount);
        overview.put("activeSessionsCount", activeSessions.size());
        overview.put("activeSessions", activeSessions);
        overview.put("completedSessionsCount", completedSessions.size());
        overview.put("totalEnergyConsumed", Math.round(totalEnergy * 100.0) / 100.0);
        overview.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        overview.put("todayRevenue", Math.round(todayRevenue * 100.0) / 100.0);
        overview.put("recentActivity", recentActivity);

        return overview;
    }

    public List<ChargingStation> getStations(int ownerId) {
        List<ChargingStation> stations = stationRepository.getStationsByOwnerId(ownerId);
        if (stations.isEmpty()) {
            return stationRepository.getAllStations();
        }
        return stations;
    }

    public ChargingStation updateStationStatus(int ownerId, int stationId, String status) {
        ChargingStation station = stationRepository.getStationById(stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Station not found with ID: " + stationId));

        if (station.getOwnerId() != null && station.getOwnerId() != ownerId) {
            throw new ForbiddenException("Access denied: You are not authorized to manage station #" + stationId);
        }

        if (status == null || (!status.equalsIgnoreCase("AVAILABLE") && !status.equalsIgnoreCase("MAINTENANCE") && !status.equalsIgnoreCase("OCCUPIED"))) {
            throw new BadRequestException("Invalid station status. Must be AVAILABLE or MAINTENANCE.");
        }

        stationRepository.updateStationStatus(stationId, status.toUpperCase());
        station.setStatus(status.toUpperCase());
        return station;
    }

    public List<ChargingSession> getActivity(int ownerId) {
        List<ChargingSession> sessions = sessionRepository.getSessionsByStationOwnerId(ownerId);
        if (sessions.isEmpty()) {
            return sessionRepository.getAllSessions();
        }
        return sessions;
    }

    public List<ChargingSession> getActiveSessions(int ownerId) {
        List<ChargingSession> sessions = getActivity(ownerId);
        return sessions.stream()
                .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getPaymentsAndRevenue(int ownerId) {
        List<Payment> payments = paymentRepository.getPaymentsByStationOwnerId(ownerId);
        if (payments.isEmpty()) {
            payments = paymentRepository.getAllPayments();
        }

        double totalRevenue = payments.stream()
                .filter(p -> "SUCCESSFUL".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        long successCount = payments.stream().filter(p -> "SUCCESSFUL".equalsIgnoreCase(p.getStatus())).count();
        double avgVal = successCount > 0 ? (totalRevenue / successCount) : 0.0;
        double todayRev = paymentRepository.getTodayVerifiedRevenueForOwner(ownerId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        result.put("verifiedRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        result.put("todayRevenue", Math.round(todayRev * 100.0) / 100.0);
        result.put("successfulPaymentsCount", successCount);
        result.put("verifiedPaymentsCount", successCount);
        result.put("averageTransactionValue", Math.round(avgVal * 100.0) / 100.0);
        result.put("payments", payments);
        return result;
    }
}
