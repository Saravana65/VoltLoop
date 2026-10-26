package com.voltloop.service;

import com.voltloop.exception.BadRequestException;
import com.voltloop.exception.ConflictException;
import com.voltloop.exception.ResourceNotFoundException;
import com.voltloop.exception.UnauthorizedException;
import com.voltloop.model.LoginRequest;
import com.voltloop.model.LoginResponse;
import com.voltloop.model.RegisterCustomerRequest;
import com.voltloop.model.User;
import com.voltloop.model.Vehicle;
import com.voltloop.repository.UserRepository;
import com.voltloop.repository.VehicleRepository;
import com.voltloop.util.AuthTokenService;
import com.voltloop.util.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final AuthTokenService tokenService;

    public AuthService(UserRepository userRepository,
                       VehicleRepository vehicleRepository,
                       AuthTokenService tokenService) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.tokenService = tokenService;
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new BadRequestException("Email and password are required.");
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        User user = userOpt.get();
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("This account is inactive. Please contact the administrator.");
        }

        if (user.getPasswordHash() == null || !PasswordUtil.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String portal = isOwnerRole(user.getRole()) ? "OWNER" : "CUSTOMER";
        String token = tokenService.generateToken(user.getUserId(), user.getEmail(), portal);

        logger.info("User {} logged in successfully with role {}", user.getEmail(), portal);
        return new LoginResponse(token, user, portal, "Login successful.");
    }

    @Transactional
    public LoginResponse registerCustomer(RegisterCustomerRequest request) {
        if (request == null) {
            throw new BadRequestException("Registration details are required.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Full name is required.");
        }
        if (request.getEmail() == null || !request.getEmail().contains("@")) {
            throw new BadRequestException("A valid email address is required.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(cleanEmail).isPresent()) {
            throw new ConflictException("An account with email '" + cleanEmail + "' already exists.");
        }

        // Strict role security: Self-registration ALWAYS creates a CUSTOMER
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(cleanEmail);
        user.setPasswordHash(PasswordUtil.hash(request.getPassword()));
        user.setRole("CUSTOMER");
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setStatus("ACTIVE");

        User createdUser = userRepository.createUser(user);

        // Optional vehicle registration in the same flow
        if (request.getRegistrationNo() != null && !request.getRegistrationNo().trim().isEmpty()) {
            String cleanReg = request.getRegistrationNo().trim().toUpperCase();
            if (vehicleRepository.existsByRegistrationNo(cleanReg)) {
                throw new ConflictException("Vehicle with registration number '" + cleanReg + "' is already registered.");
            }

            String qrId = "VL-EV-" + cleanReg.replaceAll("[^A-Z0-9]", "");
            if (vehicleRepository.existsByQrIdentifier(qrId)) {
                qrId = "VL-EV-" + System.currentTimeMillis() % 100000;
            }

            Vehicle vehicle = new Vehicle();
            vehicle.setUserId(createdUser.getUserId());
            vehicle.setVehicleType(request.getVehicleType() != null && !request.getVehicleType().trim().isEmpty() ? request.getVehicleType().trim() : "4-Wheeler (Compact EV)");
            vehicle.setRegistrationNo(cleanReg);
            vehicle.setBatteryCapacity(request.getBatteryCapacity() != null && request.getBatteryCapacity() > 0 ? request.getBatteryCapacity() : 40.0);
            vehicle.setCurrentBattery(35.0);
            vehicle.setQrIdentifier(qrId);
            vehicle.setStatus("ACTIVE");

            vehicleRepository.registerVehicle(vehicle);
            logger.info("Registered initial vehicle {} for customer {}", cleanReg, createdUser.getEmail());
        }

        String token = tokenService.generateToken(createdUser.getUserId(), createdUser.getEmail(), "CUSTOMER");
        logger.info("New customer registered: {}", createdUser.getEmail());
        return new LoginResponse(token, createdUser, "CUSTOMER", "Customer account registered successfully.");
    }

    public User getProfile(int userId) {
        return userRepository.getUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    public User updateProfile(int userId, String name, String phone) {
        User user = getProfile(userId);
        if (name != null && !name.trim().isEmpty()) {
            user.setName(name.trim());
        }
        if (phone != null) {
            user.setPhone(phone.trim());
        }
        userRepository.updateProfile(userId, user.getName(), user.getPhone());
        return user;
    }

    public boolean resetPassword(String email, String newPassword) {
        if (email == null || newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("Valid email and minimum 6-character password are required.");
        }
        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            // Return true silently to prevent email enumeration
            return true;
        }
        userRepository.updatePassword(userOpt.get().getUserId(), PasswordUtil.hash(newPassword));
        logger.info("Password reset successfully for {}", email);
        return true;
    }

    public boolean isOwnerRole(String role) {
        if (role == null) return false;
        String r = role.toUpperCase();
        return "OWNER".equals(r) || "ADMIN".equals(r) || "OPERATOR".equals(r);
    }
}
