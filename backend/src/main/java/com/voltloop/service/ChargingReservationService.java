package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ConflictException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.model.ChargingReservation;
import com.voltloop.repository.ChargingReservationRepository;
import com.voltloop.repository.ChargingStationRepository;
import com.voltloop.repository.VehicleRepository;
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
