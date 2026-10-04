package com.voltnexus.service;

import com.voltnexus.exception.BadRequestException;
import com.voltnexus.exception.ConflictException;
import com.voltnexus.exception.ResourceNotFoundException;
import com.voltnexus.model.User;
import com.voltnexus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(User user) {
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new BadRequestException("User name is required and cannot be empty.");
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new BadRequestException("User email is required and cannot be empty.");
        }
        if (userRepository.findByEmail(user.getEmail().trim()).isPresent()) {
            throw new ConflictException("User with email '" + user.getEmail() + "' already exists.");
        }

        user.setName(user.getName().trim());
        user.setEmail(user.getEmail().trim());
        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            user.setRole("DRIVER");
        } else {
            String role = user.getRole().trim().toUpperCase();
            if (!role.equals("ADMIN") && !role.equals("DRIVER") && !role.equals("OPERATOR")) {
                throw new BadRequestException("Invalid role. Role must be ADMIN, DRIVER, or OPERATOR.");
            }
            user.setRole(role);
        }

        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("ACTIVE");
        } else {
            String status = user.getStatus().trim().toUpperCase();
            if (!status.equals("ACTIVE") && !status.equals("INACTIVE")) {
                throw new BadRequestException("Invalid status. Status must be ACTIVE or INACTIVE.");
            }
            user.setStatus(status);
        }

        return userRepository.createUser(user);
    }

    public List<User> getAllUsers() {
        return userRepository.getAllUsers();
    }

    public User getUserById(int userId) {
        return userRepository.getUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }
}
