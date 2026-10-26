package com.voltloop.model;

public class PaymentSimulateRequest {
    private Integer paymentId;
    private String status; // SUCCESSFUL or FAILED
    private Boolean simulateSuccess;
    private Integer simulatedDelayMs;

    public PaymentSimulateRequest() {
    }

    public PaymentSimulateRequest(Integer paymentId, String status) {
        this.paymentId = paymentId;
        this.status = status;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public String getStatus() {
        if (status != null) return status;
        if (Boolean.FALSE.equals(simulateSuccess)) return "FAILED";
        return "SUCCESSFUL";
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getSimulateSuccess() {
        return simulateSuccess;
    }

    public void setSimulateSuccess(Boolean simulateSuccess) {
        this.simulateSuccess = simulateSuccess;
        if (Boolean.FALSE.equals(simulateSuccess)) {
            this.status = "FAILED";
        } else if (Boolean.TRUE.equals(simulateSuccess)) {
            this.status = "SUCCESSFUL";
        }
    }

    public Integer getSimulatedDelayMs() {
        return simulatedDelayMs;
    }

    public void setSimulatedDelayMs(Integer simulatedDelayMs) {
        this.simulatedDelayMs = simulatedDelayMs;
    }
}
