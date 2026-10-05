package com.voltloop.controller;

import com.voltloop.model.ChargingReservation;
import com.voltloop.service.ChargingReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ChargingReservationController {

    private final ChargingReservationService reservationService;

    public ChargingReservationController(ChargingReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<List<ChargingReservation>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChargingReservation> getReservationById(@PathVariable("id") int id) {
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @PostMapping
    public ResponseEntity<ChargingReservation> createReservation(@RequestBody ChargingReservation reservation) {
        ChargingReservation created = reservationService.createReservation(reservation);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelReservation(@PathVariable("id") int id) {
        reservationService.cancelReservation(id);
        return ResponseEntity.ok(Map.of(
                "message", "Reservation cancelled successfully.",
                "reservationId", id,
                "status", "CANCELLED"
        ));
    }
}
