package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ConflictException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.model.Vehicle;
import com.voltloop.repository.UserRepository;
import com.voltloop.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleService(VehicleRepository vehicleRepository, UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    public Vehicle registerVehicle(Vehicle vehicle) {
        if (vehicle.getUserId() == null) {
            throw new BadRequestException("User ID is required.");
        }
        if (userRepository.getUserById(vehicle.getUserId()).isEmpty()) {
            throw new ResourceNotFoundException("Associated User not found with ID: " + vehicle.getUserId());
        }
        if (vehicle.getVehicleType() == null || vehicle.getVehicleType().trim().isEmpty()) {
            throw new BadRequestException("Vehicle type is required.");
        }
        if (vehicle.getRegistrationNo() == null || vehicle.getRegistrationNo().trim().isEmpty()) {
            throw new BadRequestException("Registration number is required.");
        }
        if (vehicle.getQrIdentifier() == null || vehicle.getQrIdentifier().trim().isEmpty()) {
            throw new BadRequestException("QR identifier is required.");
        }
        if (vehicle.getBatteryCapacity() == null || vehicle.getBatteryCapacity() <= 0) {
            throw new BadRequestException("Battery capacity must be greater than 0 kWh.");
        }
        if (vehicle.getCurrentBattery() == null || vehicle.getCurrentBattery() < 0.0 || vehicle.getCurrentBattery() > 100.0) {
            throw new BadRequestException("Current battery percentage must be between 0 and 100%.");
        }

        String regNo = vehicle.getRegistrationNo().trim().toUpperCase();
        if (vehicleRepository.existsByRegistrationNo(regNo)) {
            throw new ConflictException("Vehicle with registration number '" + regNo + "' already exists.");
        }

        String qr = vehicle.getQrIdentifier().trim().toUpperCase();
        if (vehicleRepository.existsByQrIdentifier(qr)) {
            throw new ConflictException("Vehicle with QR identifier '" + qr + "' already exists.");
        }

        vehicle.setRegistrationNo(regNo);
        vehicle.setQrIdentifier(qr);
        vehicle.setVehicleType(vehicle.getVehicleType().trim());

        if (vehicle.getStatus() == null || vehicle.getStatus().trim().isEmpty()) {
            vehicle.setStatus("ACTIVE");
        } else {
            String status = vehicle.getStatus().trim().toUpperCase();
            if (!status.equals("ACTIVE") && !status.equals("INACTIVE") && !status.equals("CHARGING")) {
                throw new BadRequestException("Status must be ACTIVE, INACTIVE, or CHARGING.");
            }
            vehicle.setStatus(status);
        }

        return vehicleRepository.registerVehicle(vehicle);
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.getAllVehicles();
    }

    public Vehicle getVehicleById(int vehicleId) {
        return vehicleRepository.getVehicleById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));
    }

    public Vehicle findVehicleByQrIdentifier(String qrIdentifier) {
        if (qrIdentifier == null || qrIdentifier.trim().isEmpty()) {
            throw new BadRequestException("QR identifier cannot be empty.");
        }
        return vehicleRepository.findVehicleByQrIdentifier(qrIdentifier.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with QR identifier: " + qrIdentifier));
    }

    public void updateBatteryPercentage(int vehicleId, double currentBattery) {
        if (currentBattery < 0.0 || currentBattery > 100.0) {
            throw new BadRequestException("Battery percentage must be between 0 and 100%.");
        }
        getVehicleById(vehicleId); // Throws 404 if not found
        vehicleRepository.updateBatteryPercentage(vehicleId, currentBattery);
    }

    public void updateVehicleStatus(int vehicleId, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new BadRequestException("Vehicle status cannot be empty.");
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!normalizedStatus.equals("ACTIVE") && !normalizedStatus.equals("INACTIVE") && !normalizedStatus.equals("CHARGING")) {
            throw new BadRequestException("Invalid status. Must be ACTIVE, INACTIVE, or CHARGING.");
        }
        getVehicleById(vehicleId); // Throws 404 if not found
        vehicleRepository.updateVehicleStatus(vehicleId, normalizedStatus);
    }
}
