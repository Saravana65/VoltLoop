package com.voltnexus.service;

import com.voltnexus.exception.BadRequestException;
import com.voltnexus.exception.ConflictException;
import com.voltnexus.exception.ResourceNotFoundException;
import com.voltnexus.model.ChargingReservation;
import com.voltnexus.repository.ChargingReservationRepository;
import com.voltnexus.repository.ChargingStationRepository;
import com.voltnexus.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChargingReservationService {

    private final ChargingReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;
    private final ChargingStationRepository stationRepository;

    public ChargingReservationService(ChargingReservationRepository reservationRepository,
                                      VehicleRepository vehicleRepository,
                                      ChargingStationRepository stationRepository) {
        this.reservationRepository = reservationRepository;
        this.vehicleRepository = vehicleRepository;
        this.stationRepository = stationRepository;
    }

    public ChargingReservation createReservation(ChargingReservation reservation) {
        if (reservation.getVehicleId() == null) {
            throw new BadRequestException("Vehicle ID is required.");
        }
        if (reservation.getStationId() == null) {
            throw new BadRequestException("Station ID is required.");
        }
        if (reservation.getStartTime() == null || reservation.getEndTime() == null) {
            throw new BadRequestException("Start time and end time are required.");
        }
        if (!reservation.getEndTime().isAfter(reservation.getStartTime())) {
            throw new BadRequestException("End time must be after start time.");
        }

        if (vehicleRepository.getVehicleById(reservation.getVehicleId()).isEmpty()) {
            throw new ResourceNotFoundException("Vehicle not found with ID: " + reservation.getVehicleId());
        }
        if (stationRepository.getStationById(reservation.getStationId()).isEmpty()) {
            throw new ResourceNotFoundException("Charging Station not found with ID: " + reservation.getStationId());
        }

        // Slot Conflict Detection Check:
        List<ChargingReservation> overlaps = reservationRepository.findOverlappingReservations(
                reservation.getStationId(),
                reservation.getStartTime(),
                reservation.getEndTime()
        );

        if (!overlaps.isEmpty()) {
            throw new ConflictException("Charging slot conflict: Station is already booked during this time window.");
        }

        if (reservation.getStatus() == null || reservation.getStatus().trim().isEmpty()) {
            reservation.setStatus("RESERVED");
        }

        return reservationRepository.createReservation(reservation);
    }

    public List<ChargingReservation> getAllReservations() {
        return reservationRepository.getAllReservations();
    }

    public ChargingReservation getReservationById(int reservationId) {
        return reservationRepository.getReservationById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + reservationId));
    }

    public void cancelReservation(int reservationId) {
        getReservationById(reservationId); // Throws 404 if not found
        reservationRepository.cancelReservation(reservationId);
    }
}
