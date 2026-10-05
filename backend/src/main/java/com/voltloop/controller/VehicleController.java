package com.voltloop.controller;

import com.voltloop.model.Vehicle;
import com.voltloop.service.VehicleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable("id") int id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    /**
     * QR-based EV Identification endpoint.
     * Called when a QR code containing the vehicle's unique qrIdentifier is scanned.
     * Example: GET /api/vehicles/qr/VL-EV-001
     */
    @GetMapping("/qr/{qrIdentifier}")
    public ResponseEntity<Vehicle> getVehicleByQrIdentifier(@PathVariable("qrIdentifier") String qrIdentifier) {
        return ResponseEntity.ok(vehicleService.findVehicleByQrIdentifier(qrIdentifier));
    }

    @PostMapping
    public ResponseEntity<Vehicle> registerVehicle(@RequestBody Vehicle vehicle) {
        Vehicle created = vehicleService.registerVehicle(vehicle);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/battery")
    public ResponseEntity<Map<String, Object>> updateBatteryPercentage(
            @PathVariable("id") int id,
            @RequestBody Map<String, Double> payload) {
        Double battery = payload.get("currentBattery");
        if (battery == null) {
            battery = payload.get("battery");
        }
        if (battery == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Field 'currentBattery' is required."));
        }
        vehicleService.updateBatteryPercentage(id, battery);
        return ResponseEntity.ok(Map.of(
                "message", "Battery percentage updated successfully.",
                "vehicleId", id,
                "currentBattery", battery
        ));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateVehicleStatus(
            @PathVariable("id") int id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Field 'status' is required."));
        }
        vehicleService.updateVehicleStatus(id, status);
        return ResponseEntity.ok(Map.of(
                "message", "Vehicle status updated successfully.",
                "vehicleId", id,
                "status", status.toUpperCase()
        ));
    }
}
