package com.voltloop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Root Controller providing API discovery, system status, and links to the React Frontend.
 */
@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getRootStatus() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("project", "VoltLoop — Smart Campus EV Fleet & Energy Management System");
        response.put("status", "ONLINE");
        response.put("version", "1.0.0");
        response.put("backend", "Java 17 + Spring Boot 3.2 (Port 8080)");
        response.put("frontendUrl", "http://localhost:5173");
        response.put("message", "VoltLoop REST API is operational. For the SaaS dashboard UI, open http://localhost:5173 in your browser.");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("authLogin", "/api/auth/login");
        endpoints.put("authRegister", "/api/auth/register");
        endpoints.put("ownerOverview", "/api/owner/overview");
        endpoints.put("ownerStations", "/api/owner/stations");
        endpoints.put("ownerActivity", "/api/owner/activity");
        endpoints.put("ownerPayments", "/api/owner/payments");
        endpoints.put("customerDashboard", "/api/customer/dashboard");
        endpoints.put("customerStationQr", "/api/customer/stations/qr/{code}");
        endpoints.put("customerVehicles", "/api/customer/vehicles");
        endpoints.put("paymentsInitiate", "/api/payments/initiate");
        endpoints.put("paymentsSimulate", "/api/payments/simulate");
        endpoints.put("analytics", "/api/analytics/summary");
        endpoints.put("vehicles", "/api/vehicles");
        endpoints.put("stations", "/api/stations");
        endpoints.put("reservations", "/api/reservations");
        endpoints.put("sessions", "/api/sessions");
        endpoints.put("smartCharging", "/api/charging/recommend");
        endpoints.put("checkIn", "/api/charging/check-in");
        response.put("apiEndpoints", endpoints);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/favicon.ico")
    public ResponseEntity<Void> getFavicon() {
        return ResponseEntity.noContent().build();
    }
}
