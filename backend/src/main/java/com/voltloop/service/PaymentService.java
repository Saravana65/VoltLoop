package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ConflictException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.model.ChargingReservation;
import com.voltloop.model.ChargingSession;
import com.voltloop.model.Payment;
import com.voltloop.model.PaymentInitiateRequest;
import com.voltloop.repository.ChargingReservationRepository;
import com.voltloop.repository.ChargingSessionRepository;
import com.voltloop.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final ChargingSessionRepository sessionRepository;
    private final ChargingReservationRepository reservationRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          ChargingSessionRepository sessionRepository,
                          ChargingReservationRepository reservationRepository) {
        this.paymentRepository = paymentRepository;
        this.sessionRepository = sessionRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public Payment initiatePayment(int userId, PaymentInitiateRequest request) {
        if (request == null) {
            throw new BadRequestException("Payment initiate request is required.");
        }

        Double amount = request.getAmount();
        Integer stationId = null;

        // If for a session
        if (request.getSessionId() != null) {
            ChargingSession session = sessionRepository.getSessionById(request.getSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with ID: " + request.getSessionId()));

            // Check if already paid
            Optional<Payment> existingSuccess = paymentRepository.getPaymentBySessionId(session.getSessionId());
            if (existingSuccess.isPresent() && "SUCCESSFUL".equalsIgnoreCase(existingSuccess.get().getStatus())) {
                throw new ConflictException("Charging session #" + session.getSessionId() + " has already been paid for (Ref: " + existingSuccess.get().getTransactionRef() + ").");
            }

            stationId = session.getStationId();
            if (amount == null || amount <= 0) {
                amount = session.getChargingCost() != null ? session.getChargingCost() : 0.0;
            }
        } else if (request.getReservationId() != null) {
            ChargingReservation res = reservationRepository.getReservationById(request.getReservationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + request.getReservationId()));
            stationId = res.getStationId();
            if (amount == null || amount <= 0) {
                amount = 50.00; // Standard nominal booking advance fee
            }
        }

        if (amount == null || amount <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero.");
        }

        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String txnRef = "TXN-VL-" + datePart + "-" + randPart;

        Payment payment = new Payment();
        payment.setUserId(userId);
        payment.setSessionId(request.getSessionId());
        payment.setReservationId(request.getReservationId());
        payment.setStationId(stationId);
        payment.setAmount(amount);
        payment.setCurrency("INR");
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "SIMULATED_UPI");
        payment.setTransactionRef(txnRef);
        payment.setStatus("PENDING");
        payment.setSimulated(true);
        payment.setCreatedAt(LocalDateTime.now());

        Payment created = paymentRepository.createPayment(payment);
        logger.info("Initiated payment #{} (Ref: {}) for user {}", created.getPaymentId(), txnRef, userId);
        return created;
    }

    @Transactional
    public Payment simulatePaymentCompletion(int userId, int paymentId, String requestedStatus) {
        Payment payment = paymentRepository.getPaymentById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found with ID: " + paymentId));

        if ("SUCCESSFUL".equalsIgnoreCase(payment.getStatus())) {
            throw new ConflictException("Payment #" + paymentId + " is already marked SUCCESSFUL. Duplicate processing blocked.");
        }

        String finalStatus = "FAILED".equalsIgnoreCase(requestedStatus) ? "FAILED" : "SUCCESSFUL";
        LocalDateTime completedAt = LocalDateTime.now();

        paymentRepository.updatePaymentStatus(paymentId, finalStatus, completedAt);
        payment.setStatus(finalStatus);
        payment.setCompletedAt(completedAt);

        logger.info("Simulated payment #{} marked as {} for user {}", paymentId, finalStatus, userId);
        return paymentRepository.getPaymentById(paymentId).orElse(payment);
    }

    public Payment getReceipt(int currentUserId, boolean isOwner, int paymentId) {
        Payment payment = paymentRepository.getPaymentById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found for payment ID: " + paymentId));

        // Strict customer isolation check
        if (!isOwner && payment.getUserId() != currentUserId) {
            throw new BadRequestException("Access denied: You can only view receipts for your own transactions.");
        }

        return payment;
    }

    public Payment getReceiptByTransactionRef(int currentUserId, boolean isOwner, String transactionRef) {
        Payment payment = paymentRepository.getPaymentByTransactionRef(transactionRef)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found for transaction reference: " + transactionRef));

        if (!isOwner && payment.getUserId() != currentUserId) {
            throw new BadRequestException("Access denied: You can only view receipts for your own transactions.");
        }

        return payment;
    }

    public List<Payment> getCustomerPayments(int userId) {
        return paymentRepository.getPaymentsByUserId(userId);
    }

    public List<Payment> getOwnerPayments(int ownerId) {
        return paymentRepository.getPaymentsByStationOwnerId(ownerId);
    }
}
