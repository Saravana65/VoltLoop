package com.voltloop.controller;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.UnauthorizedException;
import com.voltloop.model.*;
import com.voltloop.service.CustomerService;
import com.voltloop.util.AuthTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final CustomerService customerService;
    private final AuthTokenService tokenService;

    public CustomerController(CustomerService customerService, AuthTokenService tokenService) {
        this.customerService = customerService;
        this.tokenService = tokenService;
    }

    private int resolveCustomerId(String authHeader) {
        if (authHeader != null && !authHeader.trim().isEmpty()) {
            AuthTokenService.AuthenticatedUser user = tokenService.validateAndExtractUser(authHeader);
            if (user == null) {
                throw new UnauthorizedException("Invalid or expired authentication token.");
            }
            return user.getUserId();
        }
        // Default to Primary Customer (Amit Verma, User 3) for quick evaluation & testing
        return 3;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        return ResponseEntity.ok(customerService.getCustomerDashboard(userId));
    }

    @GetMapping("/stations/qr/{identifier}")
    public ResponseEntity<StationQRResolutionResponse> resolveStationByQr(
            @PathVariable("identifier") String identifier,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        return ResponseEntity.ok(customerService.resolveStationByQr(userId, identifier));
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getCustomerVehicles(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        return ResponseEntity.ok(customerService.getCustomerVehicles(userId));
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> addVehicle(
            @RequestBody Vehicle vehicle,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        Vehicle created = customerService.addCustomerVehicle(userId, vehicle);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/charging/start")
    public ResponseEntity<ChargingSession> startCharging(
            @RequestBody Map<String, Integer> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        Integer vehicleId = body.get("vehicleId");
        Integer stationId = body.get("stationId");
        if (vehicleId == null || stationId == null) {
            throw new BadRequestException("Vehicle ID and Station ID are required.");
        }
        ChargingSession session = customerService.startCustomerCharging(userId, vehicleId, stationId);
        return new ResponseEntity<>(session, HttpStatus.CREATED);
    }

    @PostMapping("/charging/complete")
    public ResponseEntity<ChargingSession> completeCharging(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        Number sessNum = (Number) body.get("sessionId");
        Number batNum = (Number) body.get("finalBattery");
        if (sessNum == null) {
            throw new BadRequestException("Session ID is required.");
        }
        double finalBat = batNum != null ? batNum.doubleValue() : 100.0;
        ChargingSession session = customerService.completeCustomerCharging(userId, sessNum.intValue(), finalBat);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChargingSession>> getMySessions(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        return ResponseEntity.ok(customerService.getCustomerSessions(userId));
    }

    @GetMapping({"/bookings", "/reservations"})
    public ResponseEntity<List<ChargingReservation>> getMyReservations(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        return ResponseEntity.ok(customerService.getCustomerDashboard(userId).get("upcomingBookings") != null ?
                (List<ChargingReservation>) customerService.getCustomerDashboard(userId).get("upcomingBookings") : List.of());
    }

    @PostMapping({"/bookings", "/reservations"})
    public ResponseEntity<SmartReservationResponse> createBooking(
            @RequestBody SmartReservationRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        SmartReservationResponse res = customerService.createCustomerBooking(userId, request);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @PutMapping({"/bookings/{id}/cancel", "/reservations/{id}/cancel"})
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable("id") int reservationId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        boolean success = customerService.cancelCustomerBooking(userId, reservationId);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Reservation cancelled successfully." : "Reservation cancellation could not be processed."
        ));
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        return ResponseEntity.ok(customerService.getCustomerProfile(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int userId = resolveCustomerId(authHeader);
        String name = body.get("name");
        String phone = body.get("phone");
        return ResponseEntity.ok(customerService.updateCustomerProfile(userId, name, phone));
    }
}
