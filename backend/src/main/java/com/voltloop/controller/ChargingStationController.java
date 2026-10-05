package com.voltloop.controller;

import com.voltloop.model.ChargingStation;
import com.voltloop.service.ChargingStationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stations")
public class ChargingStationController {

    private final ChargingStationService stationService;

    public ChargingStationController(ChargingStationService stationService) {
        this.stationService = stationService;
    }

    @GetMapping
    public ResponseEntity<List<ChargingStation>> getAllStations() {
        return ResponseEntity.ok(stationService.getAllStations());
    }

    @GetMapping("/available")
    public ResponseEntity<List<ChargingStation>> getAvailableStations() {
        return ResponseEntity.ok(stationService.getAvailableStations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChargingStation> getStationById(@PathVariable("id") int id) {
        return ResponseEntity.ok(stationService.getStationById(id));
    }

    @PostMapping
    public ResponseEntity<ChargingStation> createStation(@RequestBody ChargingStation station) {
        ChargingStation created = stationService.createStation(station);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStationStatus(
            @PathVariable("id") int id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Field 'status' is required."));
        }
        stationService.updateStationStatus(id, status);
        return ResponseEntity.ok(Map.of(
                "message", "Station status updated successfully.",
                "stationId", id,
                "status", status.toUpperCase()
        ));
    }
}
