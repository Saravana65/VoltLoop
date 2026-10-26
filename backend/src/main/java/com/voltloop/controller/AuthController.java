package com.voltloop.controller;

import com.voltloop.exception.BadRequestException;
import com.voltloop.model.*;
import com.voltloop.service.AuthService;
import com.voltloop.util.AuthTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthTokenService tokenService;

    public AuthController(AuthService authService, AuthTokenService tokenService) {
        this.authService = authService;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/register", "/register-customer"})
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterCustomerRequest request) {
        LoginResponse response = authService.registerCustomer(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthTokenService.AuthenticatedUser authUser = tokenService.validateAndExtractUser(authHeader);
        if (authUser == null) {
            throw new BadRequestException("Unauthorized: Valid authorization token is required.");
        }
        User user = authService.getProfile(authUser.getUserId());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {
        AuthTokenService.AuthenticatedUser authUser = tokenService.validateAndExtractUser(authHeader);
        if (authUser == null) {
            throw new BadRequestException("Unauthorized: Valid authorization token is required.");
        }
        String name = body.get("name");
        String phone = body.get("phone");
        User updated = authService.updateProfile(authUser.getUserId(), name, phone);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            newPassword = "Password@2026"; // Reset to standard temporary password if not provided
        }
        authService.resetPassword(email, newPassword);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "If the email is registered, password has been reset. You may log in with your updated credentials."
        ));
    }
}
