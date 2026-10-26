package com.voltloop.model;

import java.time.LocalDateTime;

public class Payment {
    private Integer paymentId;
    private Integer userId;
    private Integer sessionId;
    private Integer reservationId;
    private Integer stationId;
    private Double amount;
    private String currency; // INR
    private String paymentMethod; // SIMULATED_UPI, SIMULATED_CARD, CAMPUS_WALLET
    private String transactionRef; // e.g. TXN-VL-20261026-9938
    private String status; // PENDING, SUCCESSFUL, FAILED, CANCELLED, REFUNDED
    private Boolean simulated;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    // Display fields joined for receipts & audit
    private String userName;
    private String userEmail;
    private String userPhone;
    private String stationName;
    private String stationLocation;
    private String registrationNo;
    private String vehicleType;
    private Double energyConsumed;
    private Long durationMinutes;
    private LocalDateTime sessionStartTime;
    private LocalDateTime sessionEndTime;

    public Payment() {
    }

    public Payment(Integer paymentId, Integer userId, Integer sessionId, Integer reservationId, Integer stationId,
                   Double amount, String currency, String paymentMethod, String transactionRef,
                   String status, Boolean simulated, LocalDateTime createdAt, LocalDateTime completedAt) {
        this.paymentId = paymentId;
        this.userId = userId;
        this.sessionId = sessionId;
        this.reservationId = reservationId;
        this.stationId = stationId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.transactionRef = transactionRef;
        this.status = status;
        this.simulated = simulated;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
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

    public Integer getStationId() {
        return stationId;
    }

    public void setStationId(Integer stationId) {
        this.stationId = stationId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getSimulated() {
        return simulated;
    }

    public void setSimulated(Boolean simulated) {
        this.simulated = simulated;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getCustomerName() {
        return userName;
    }

    public void setCustomerName(String customerName) {
        this.userName = customerName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getCustomerEmail() {
        return userEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.userEmail = customerEmail;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public String getCustomerPhone() {
        return userPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.userPhone = customerPhone;
    }

    public String getStationName() {
        return stationName;
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
    }

    public String getStationLocation() {
        return stationLocation;
    }

    public void setStationLocation(String stationLocation) {
        this.stationLocation = stationLocation;
    }

    public String getRegistrationNo() {
        return registrationNo;
    }

    public void setRegistrationNo(String registrationNo) {
        this.registrationNo = registrationNo;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Double getEnergyConsumed() {
        return energyConsumed;
    }

    public void setEnergyConsumed(Double energyConsumed) {
        this.energyConsumed = energyConsumed;
    }

    public Long getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Long durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public LocalDateTime getSessionStartTime() {
        return sessionStartTime;
    }

    public void setSessionStartTime(LocalDateTime sessionStartTime) {
        this.sessionStartTime = sessionStartTime;
    }

    public LocalDateTime getSessionEndTime() {
        return sessionEndTime;
    }

    public void setSessionEndTime(LocalDateTime sessionEndTime) {
        this.sessionEndTime = sessionEndTime;
    }
}
