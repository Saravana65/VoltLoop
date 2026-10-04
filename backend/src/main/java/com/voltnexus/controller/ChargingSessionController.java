package com.voltnexus.controller;

import com.voltnexus.model.ChargingSession;
import com.voltnexus.service.ChargingSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class ChargingSessionController {

    private final ChargingSessionService sessionService;

    public ChargingSessionController(ChargingSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    public ResponseEntity<List<ChargingSession>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ChargingSession>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChargingSession> getSessionById(@PathVariable("id") int id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<ChargingSession>> getSessionsByVehicleId(@PathVariable("vehicleId") int vehicleId) {
        return ResponseEntity.ok(sessionService.getSessionsByVehicleId(vehicleId));
    }

    @PostMapping("/start")
    public ResponseEntity<ChargingSession> startSession(@RequestBody ChargingSession session) {
        ChargingSession started = sessionService.startSession(session);
        return new ResponseEntity<>(started, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ChargingSession> completeSession(
            @PathVariable("id") int id,
            @RequestBody(required = false) Map<String, Double> payload) {
        Double finalBattery = null;
        Double energyConsumed = null;
        Double chargingCost = null;

        if (payload != null) {
            finalBattery = payload.get("finalBattery");
            energyConsumed = payload.get("energyConsumed");
            chargingCost = payload.get("chargingCost");
        }

        ChargingSession completed = sessionService.completeSession(id, finalBattery, energyConsumed, chargingCost);
        return ResponseEntity.ok(completed);
    }
}
