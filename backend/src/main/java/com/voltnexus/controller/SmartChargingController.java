package com.voltnexus.controller;

import com.voltnexus.model.*;
import com.voltnexus.service.SmartChargingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for the Smart Charging Allocation Engine & QR Workflow.
 */
@RestController
@RequestMapping("/api/charging")
public class SmartChargingController {

    private final SmartChargingService smartChargingService;

    public SmartChargingController(SmartChargingService smartChargingService) {
        this.smartChargingService = smartChargingService;
    }

    /**
     * Smart Charging Station Recommendation.
     * Evaluates EV state, calculates priority score, filters compatible bays,
     * and recommends the best station.
     * POST /api/charging/recommend
     */
    @PostMapping("/recommend")
    public ResponseEntity<RecommendationResponse> recommendStation(@RequestBody RecommendationRequest request) {
        RecommendationResponse response = smartChargingService.recommendStation(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Smart Charging Reservation.
     * Transactionally reserves a charging bay with interval conflict detection.
     * POST /api/charging/reserve
     */
    @PostMapping("/reserve")
    public ResponseEntity<SmartReservationResponse> createSmartReservation(@RequestBody SmartReservationRequest request) {
        SmartReservationResponse response = smartChargingService.createSmartReservation(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Start Charging Session via QR Scan.
     * Transactionally inserts session, flips vehicle to CHARGING and station to OCCUPIED.
     * POST /api/charging/start
     */
    @PostMapping("/start")
    public ResponseEntity<ChargingSession> startCharging(@RequestBody StartChargingRequest request) {
        ChargingSession session = smartChargingService.startChargingByQr(request);
        return new ResponseEntity<>(session, HttpStatus.CREATED);
    }

    /**
     * Complete Charging Session.
     * Transactionally completes session, computes energy consumed (kWh) and cost,
     * updates vehicle battery & ACTIVE status, and marks station AVAILABLE.
     * POST /api/charging/complete
     */
    @PostMapping("/complete")
    public ResponseEntity<ChargingSession> completeCharging(@RequestBody CompleteChargingRequest request) {
        ChargingSession session = smartChargingService.completeCharging(request);
        return ResponseEntity.ok(session);
    }

    /**
     * Retrieve Charging History for an EV.
     * GET /api/charging/history/{vehicleId}
     */
    @GetMapping("/history/{vehicleId}")
    public ResponseEntity<List<ChargingSession>> getChargingHistory(@PathVariable("vehicleId") int vehicleId) {
        return ResponseEntity.ok(smartChargingService.getChargingHistory(vehicleId));
    }

    /**
     * Retrieve all active charging sessions.
     * GET /api/charging/active
     */
    @GetMapping("/active")
    public ResponseEntity<List<ChargingSession>> getActiveSessions() {
        return ResponseEntity.ok(smartChargingService.getActiveSessions());
    }

    /**
     * Quick Recommendation by Vehicle ID.
     * GET /api/charging/stations/recommended/{vehicleId}
     */
    @GetMapping("/stations/recommended/{vehicleId}")
    public ResponseEntity<RecommendationResponse> getRecommendedStationForVehicle(@PathVariable("vehicleId") int vehicleId) {
        return ResponseEntity.ok(smartChargingService.getRecommendedStationForVehicle(vehicleId));
    }
}
