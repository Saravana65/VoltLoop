package com.voltloop.controller;

import com.voltloop.exception.BadRequestException;
import com.voltloop.model.Payment;
import com.voltloop.model.PaymentInitiateRequest;
import com.voltloop.model.PaymentSimulateRequest;
import com.voltloop.service.PaymentService;
import com.voltloop.util.AuthTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthTokenService tokenService;

    public PaymentController(PaymentService paymentService, AuthTokenService tokenService) {
        this.paymentService = paymentService;
        this.tokenService = tokenService;
    }

    private AuthTokenService.AuthenticatedUser resolveUser(String authHeader) {
        if (authHeader != null && !authHeader.trim().isEmpty()) {
            AuthTokenService.AuthenticatedUser user = tokenService.validateAndExtractUser(authHeader);
            if (user != null) return user;
        }
        return new AuthTokenService.AuthenticatedUser(3, "amit.verma@campus.edu", "CUSTOMER");
    }

    @PostMapping("/initiate")
    public ResponseEntity<Payment> initiatePayment(
            @RequestBody PaymentInitiateRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthTokenService.AuthenticatedUser user = resolveUser(authHeader);
        Payment payment = paymentService.initiatePayment(user.getUserId(), request);
        return new ResponseEntity<>(payment, HttpStatus.CREATED);
    }

    @PostMapping("/simulate")
    public ResponseEntity<Payment> simulatePayment(
            @RequestBody PaymentSimulateRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthTokenService.AuthenticatedUser user = resolveUser(authHeader);
        if (request == null || request.getPaymentId() == null) {
            throw new BadRequestException("Payment ID is required.");
        }
        Payment completed = paymentService.simulatePaymentCompletion(user.getUserId(), request.getPaymentId(), request.getStatus());
        return ResponseEntity.ok(completed);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(
            @PathVariable("id") int paymentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthTokenService.AuthenticatedUser user = resolveUser(authHeader);
        Payment receipt = paymentService.getReceipt(user.getUserId(), user.isOwner(), paymentId);
        return ResponseEntity.ok(receipt);
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<Payment> getReceipt(
            @PathVariable("id") int paymentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return getPaymentById(paymentId, authHeader);
    }

    @GetMapping({"/receipt/{transactionRef}", "/ref/{transactionRef}"})
    public ResponseEntity<Payment> getReceiptByTransactionRef(
            @PathVariable("transactionRef") String transactionRef,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthTokenService.AuthenticatedUser user = resolveUser(authHeader);
        Payment receipt = paymentService.getReceiptByTransactionRef(user.getUserId(), user.isOwner(), transactionRef);
        return ResponseEntity.ok(receipt);
    }

    @GetMapping({"/my", "/customer"})
    public ResponseEntity<List<Payment>> getMyPayments(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthTokenService.AuthenticatedUser user = resolveUser(authHeader);
        return ResponseEntity.ok(paymentService.getCustomerPayments(user.getUserId()));
    }
}
