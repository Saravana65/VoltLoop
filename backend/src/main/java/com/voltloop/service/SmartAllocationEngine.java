package com.voltloop.service;

import com.voltloop.model.ChargingStation;
import com.voltloop.model.Vehicle;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Deterministic, rule-based Smart Charging Allocation Engine.
 * Formulates priority scoring, connector compatibility validation,
 * energy requirements, charging turnaround estimation, and best station selection.
 */
@Component
public class SmartAllocationEngine {

    public static class PriorityResult {
        private final int score;
        private final String urgencyLevel;
        private final int batteryScore;
        private final int waitingScore;

        public PriorityResult(int score, String urgencyLevel, int batteryScore, int waitingScore) {
            this.score = score;
            this.urgencyLevel = urgencyLevel;
            this.batteryScore = batteryScore;
            this.waitingScore = waitingScore;
        }

        public int getScore() {
            return score;
        }

        public String getUrgencyLevel() {
            return urgencyLevel;
        }

        public int getBatteryScore() {
            return batteryScore;
        }

        public int getWaitingScore() {
            return waitingScore;
        }
    }

    /**
     * Rule-based priority scoring.
     * Battery Urgency:
     *   0â€“20%   : 100 pts (VERY_HIGH)
     *   21â€“40%  : 75 pts  (HIGH)
     *   41â€“70%  : 50 pts  (MEDIUM)
     *   71â€“100% : 25 pts  (LOW)
     * Waiting Score:
     *   Adds 1 point for every 2 minutes of waiting (capped at 50 pts).
     */
    public PriorityResult calculatePriority(double currentBattery, int waitingMinutes) {
        int batteryScore;
        if (currentBattery <= 20.0) {
            batteryScore = 100;
        } else if (currentBattery <= 40.0) {
            batteryScore = 75;
        } else if (currentBattery <= 70.0) {
            batteryScore = 50;
        } else {
            batteryScore = 25;
        }

        int waitingScore = Math.max(0, Math.min(50, waitingMinutes / 2));
        int totalScore = batteryScore + waitingScore;

        String urgencyLevel;
        if (totalScore >= 100) {
            urgencyLevel = "VERY_HIGH";
        } else if (totalScore >= 75) {
            urgencyLevel = "HIGH";
        } else if (totalScore >= 50) {
            urgencyLevel = "MEDIUM";
        } else {
            urgencyLevel = "LOW";
        }

        return new PriorityResult(totalScore, urgencyLevel, batteryScore, waitingScore);
    }

    /**
     * Deterministic physical connector compatibility check.
     */
    public boolean isConnectorCompatible(String vehicleType, String connectorType) {
        if (vehicleType == null || connectorType == null) {
            return false;
        }
        String vType = vehicleType.toLowerCase();
        String cType = connectorType.toUpperCase();

        // 2-Wheelers (e-Scooters, e-Motorbikes)
        if (vType.contains("2-wheeler") || vType.contains("scooter") || vType.contains("bike") || vType.contains("motorbike")) {
            return cType.contains("TYPE 2") || cType.contains("15A") || cType.contains("SOCKET");
        }

        // Maintenance & Utility Carts
        if (vType.contains("cart") || vType.contains("utility")) {
            return cType.contains("15A") || cType.contains("SOCKET") || cType.contains("TYPE 2");
        }

        // 4-Wheelers (Compact, Sedan, SUV) & Fleet Shuttles / Vans
        if (vType.contains("4-wheeler") || vType.contains("sedan") || vType.contains("suv") ||
                vType.contains("compact") || vType.contains("shuttle") || vType.contains("van") || vType.contains("bus")) {
            return cType.contains("CCS2") || cType.contains("TYPE 2");
        }

        // Generic fallback: match Type 2 as universal campus standard
        return cType.contains("TYPE 2");
    }

    /**
     * Energy Required (kWh) = Battery Capacity * (Target % - Current %) / 100
     */
    public double calculateRequiredEnergy(double batteryCapacity, double currentBattery, double targetBattery) {
        double delta = Math.max(0.0, targetBattery - currentBattery);
        double energy = (batteryCapacity * delta) / 100.0;
        return Math.round(energy * 100.0) / 100.0;
    }

    /**
     * Estimated Charging Time (Minutes) = (Required Energy kWh / Power Rating kW) * 60
     */
    public int estimateChargingMinutes(double requiredKwh, double powerRatingKw) {
        if (powerRatingKw <= 0 || requiredKwh <= 0) {
            return 0;
        }
        double hours = requiredKwh / powerRatingKw;
        return Math.max(1, (int) Math.round(hours * 60.0));
    }

    /**
     * Filter and rank eligible stations to select the optimal charging station.
     * Criteria:
     * 1. Status must be AVAILABLE.
     * 2. Connector must be compatible with EV.
     * 3. Power rating > 0.
     * 4. Preference: Shortest estimated turnaround time (highest usable charging power).
     */
    public Optional<ChargingStation> selectBestStation(Vehicle vehicle, List<ChargingStation> availableStations, double targetBattery) {
        List<ChargingStation> compatible = filterCompatibleStations(vehicle, availableStations);
        if (compatible.isEmpty()) {
            return Optional.empty();
        }

        double requiredKwh = calculateRequiredEnergy(vehicle.getBatteryCapacity(), vehicle.getCurrentBattery(), targetBattery);

        // Sort by shortest turnaround time (highest power rating), tie-breaker by station ID
        return compatible.stream()
                .min(Comparator
                        .<ChargingStation, Integer>comparing(s -> estimateChargingMinutes(requiredKwh, s.getPowerRating()))
                        .thenComparing(ChargingStation::getStationId));
    }

    public List<ChargingStation> filterCompatibleStations(Vehicle vehicle, List<ChargingStation> stations) {
        return stations.stream()
                .filter(s -> "AVAILABLE".equalsIgnoreCase(s.getStatus()))
                .filter(s -> isConnectorCompatible(vehicle.getVehicleType(), s.getConnectorType()))
                .collect(Collectors.toList());
    }

    public String generateRecommendationReason(Vehicle vehicle, ChargingStation station,
                                               double requiredKwh, int estimatedMinutes, PriorityResult priority) {
        return String.format(
                "Optimal allocation: %s (%s, %.1f kW) selected. Provides fastest turnaround time of %d mins " +
                        "to deliver %.2f kWh (from %.1f%% to target SoC). Vehicle urgency is %s (Priority Score: %d).",
                station.getStationName(),
                station.getChargerType(),
                station.getPowerRating(),
                estimatedMinutes,
                requiredKwh,
                vehicle.getCurrentBattery(),
                priority.getUrgencyLevel(),
                priority.getScore()
        );
    }
}
