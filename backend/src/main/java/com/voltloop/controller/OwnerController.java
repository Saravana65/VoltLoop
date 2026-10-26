package com.voltloop.controller;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ForbiddenException;
import com.voltloop.exception.UnauthorizedException;
import com.voltloop.model.ChargingSession;
import com.voltloop.model.ChargingStation;
import com.voltloop.service.OwnerService;
import com.voltloop.util.AuthTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final OwnerService ownerService;
    private final AuthTokenService tokenService;

    public OwnerController(OwnerService ownerService, AuthTokenService tokenService) {
        this.ownerService = ownerService;
        this.tokenService = tokenService;
    }

    private int resolveOwnerId(String authHeader) {
        if (authHeader != null && !authHeader.trim().isEmpty()) {
            AuthTokenService.AuthenticatedUser user = tokenService.validateAndExtractUser(authHeader);
            if (user == null) {
                throw new UnauthorizedException("Invalid or expired authentication token.");
            }
            if (!user.isOwner()) {
                throw new ForbiddenException("Access denied: Owner privileges required for Owner Portal.");
            }
            return user.getUserId();
        }
        // Default to Primary Owner (Dr. Rajesh Sharma) for seamless prototype navigation if no auth header
        return 1;
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int ownerId = resolveOwnerId(authHeader);
        return ResponseEntity.ok(ownerService.getOverview(ownerId));
    }

    @GetMapping("/stations")
    public ResponseEntity<List<ChargingStation>> getStations(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int ownerId = resolveOwnerId(authHeader);
        return ResponseEntity.ok(ownerService.getStations(ownerId));
    }

    @PutMapping("/stations/{id}/status")
    public ResponseEntity<ChargingStation> updateStationStatus(
            @PathVariable("id") int stationId,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int ownerId = resolveOwnerId(authHeader);
        String status = body.get("status");
        return ResponseEntity.ok(ownerService.updateStationStatus(ownerId, stationId, status));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ChargingSession>> getActivity(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int ownerId = resolveOwnerId(authHeader);
        return ResponseEntity.ok(ownerService.getActivity(ownerId));
    }

    @GetMapping("/sessions/active")
    public ResponseEntity<List<ChargingSession>> getActiveSessions(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int ownerId = resolveOwnerId(authHeader);
        return ResponseEntity.ok(ownerService.getActiveSessions(ownerId));
    }

    @GetMapping({"/revenue", "/payments"})
    public ResponseEntity<Map<String, Object>> getPaymentsAndRevenue(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int ownerId = resolveOwnerId(authHeader);
        return ResponseEntity.ok(ownerService.getPaymentsAndRevenue(ownerId));
    }
}
