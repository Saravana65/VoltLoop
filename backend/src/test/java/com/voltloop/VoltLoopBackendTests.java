package com.voltloop;

import com.voltloop.model.*;
import com.voltloop.service.SmartAllocationEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit and domain verification tests for VoltLoop:
 * Phase 3 Models and Phase 4 Smart Charging Allocation Engine.
 */
class VoltLoopBackendTests {

    private SmartAllocationEngine allocationEngine;

    @BeforeEach
    void setUp() {
        allocationEngine = new SmartAllocationEngine();
    }

    @Test
    @DisplayName("Verify Vehicle model and QR identifier mapping")
    void testVehicleModel() {
        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleId(1);
        vehicle.setUserId(2);
        vehicle.setRegistrationNo("KA-01-EV-1021");
        vehicle.setVehicleType("2-Wheeler (e-Scooter)");
        vehicle.setBatteryCapacity(3.50);
        vehicle.setCurrentBattery(85.00);
        vehicle.setQrIdentifier("VL-EV-001");
        vehicle.setStatus("ACTIVE");

        assertEquals(1, vehicle.getVehicleId());
        assertEquals("VL-EV-001", vehicle.getQrIdentifier());
        assertEquals("KA-01-EV-1021", vehicle.getRegistrationNo());
        assertEquals(85.00, vehicle.getCurrentBattery());
        assertEquals("ACTIVE", vehicle.getStatus());
    }

    @Test
    @DisplayName("Smart Charging: Priority Engine accurately scores battery urgency")
    void testPriorityCalculation() {
        // 0-20%: Very High Urgency (Score 100)
        SmartAllocationEngine.PriorityResult p1 = allocationEngine.calculatePriority(15.0, 0);
        assertEquals(100, p1.getScore());
        assertEquals("VERY_HIGH", p1.getUrgencyLevel());

        // 21-40%: High Urgency (Score 75)
        SmartAllocationEngine.PriorityResult p2 = allocationEngine.calculatePriority(30.0, 0);
        assertEquals(75, p2.getScore());
        assertEquals("HIGH", p2.getUrgencyLevel());

        // 41-70%: Medium Urgency (Score 50)
        SmartAllocationEngine.PriorityResult p3 = allocationEngine.calculatePriority(55.0, 0);
        assertEquals(50, p3.getScore());
        assertEquals("MEDIUM", p3.getUrgencyLevel());

        // 71-100%: Low Urgency (Score 25)
        SmartAllocationEngine.PriorityResult p4 = allocationEngine.calculatePriority(85.0, 0);
        assertEquals(25, p4.getScore());
        assertEquals("LOW", p4.getUrgencyLevel());

        // Waiting time boost: 20 minutes wait = +10 points
        SmartAllocationEngine.PriorityResult pWait = allocationEngine.calculatePriority(55.0, 20);
        assertEquals(60, pWait.getScore());
    }

    @Test
    @DisplayName("Smart Charging: Connector compatibility matrix")
    void testConnectorCompatibility() {
        // 2-Wheelers compatible with Type 2 and Standard 15A
        assertTrue(allocationEngine.isConnectorCompatible("2-Wheeler (e-Scooter)", "Type 2"));
        assertTrue(allocationEngine.isConnectorCompatible("2-Wheeler (e-Motorbike)", "Standard 15A"));
        assertFalse(allocationEngine.isConnectorCompatible("2-Wheeler (e-Scooter)", "CCS2"));

        // 4-Wheelers compatible with CCS2 and Type 2
        assertTrue(allocationEngine.isConnectorCompatible("4-Wheeler (Sedan EV)", "CCS2"));
        assertTrue(allocationEngine.isConnectorCompatible("4-Wheeler (Compact EV)", "Type 2"));
        assertFalse(allocationEngine.isConnectorCompatible("4-Wheeler (SUV EV)", "Standard 15A"));

        // Shuttle Bus compatible with CCS2
        assertTrue(allocationEngine.isConnectorCompatible("Campus Shuttle Bus", "CCS2"));

        // Maintenance Cart compatible with Standard 15A
        assertTrue(allocationEngine.isConnectorCompatible("Maintenance Utility Cart", "Standard 15A"));
    }

    @Test
    @DisplayName("Smart Charging: Required Energy and Charging Time Estimation")
    void testEnergyAndDurationEstimation() {
        double batteryCapacity = 32.0; // 32 kWh
        double currentBattery = 18.5;  // 18.5%
        double targetBattery = 80.0;   // 80%

        // Required Energy = 32.0 * (80.0 - 18.5) / 100 = 19.68 kWh
        double requiredEnergy = allocationEngine.calculateRequiredEnergy(batteryCapacity, currentBattery, targetBattery);
        assertEquals(19.68, requiredEnergy, 0.05);

        // Charging on DC Fast 50 kW: 19.68 / 50 * 60 = ~24 minutes
        int minutes50Kw = allocationEngine.estimateChargingMinutes(requiredEnergy, 50.0);
        assertEquals(24, minutes50Kw);

        // Charging on AC 22 kW: 19.68 / 22 * 60 = ~54 minutes
        int minutes22Kw = allocationEngine.estimateChargingMinutes(requiredEnergy, 22.0);
        assertEquals(54, minutes22Kw);
    }

    @Test
    @DisplayName("Smart Charging: Optimal station selection chooses fastest turnaround time")
    void testSelectBestStation() {
        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleId(2);
        vehicle.setVehicleType("4-Wheeler (Compact EV)");
        vehicle.setBatteryCapacity(32.0);
        vehicle.setCurrentBattery(18.5);

        ChargingStation st1 = new ChargingStation(1, "CS-ENGG-01", "Engineering Lot", "AC Dual", 22.0, "Type 2", "AVAILABLE", LocalDateTime.now());
        ChargingStation st2 = new ChargingStation(2, "CS-ADMIN-01", "Admin Bay", "DC Fast", 50.0, "CCS2", "AVAILABLE", LocalDateTime.now());
        ChargingStation st3 = new ChargingStation(3, "CS-SPORTS-01", "Sports Lot", "AC Socket", 3.3, "Standard 15A", "AVAILABLE", LocalDateTime.now());

        List<ChargingStation> stations = List.of(st1, st2, st3);

        // Best station should be st2 (DC Fast 50kW) because it delivers the shortest charging time
        Optional<ChargingStation> best = allocationEngine.selectBestStation(vehicle, stations, 80.0);
        assertTrue(best.isPresent());
        assertEquals("CS-ADMIN-01", best.get().getStationName());
        assertEquals(50.0, best.get().getPowerRating());
    }
}
