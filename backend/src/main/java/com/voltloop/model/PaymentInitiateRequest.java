package com.voltloop.model;

public class PaymentInitiateRequest {
    private Integer sessionId;
    private Integer reservationId;
    private Double amount;
    private String paymentMethod; // SIMULATED_UPI, SIMULATED_CARD, CAMPUS_WALLET

    public PaymentInitiateRequest() {
    }

    public PaymentInitiateRequest(Integer sessionId, Integer reservationId, Double amount, String paymentMethod) {
        this.sessionId = sessionId;
        this.reservationId = reservationId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public Integer getSessionId() {
        return sessionId;
    }

    public void setSessionId(Integer sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getReservationId() {
        return reservationId;
    }

    public void setReservationId(Integer reservationId) {
        this.reservationId = reservationId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
