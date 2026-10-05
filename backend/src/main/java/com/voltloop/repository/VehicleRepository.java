package com.voltloop.repository;

import com.voltloop.model.Vehicle;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class VehicleRepository {

    private final JdbcTemplate jdbcTemplate;

    public VehicleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static class VehicleRowMapper implements RowMapper<Vehicle> {
        @Override
        public Vehicle mapRow(ResultSet rs, int rowNum) throws SQLException {
            Vehicle vehicle = new Vehicle();
            vehicle.setVehicleId(rs.getInt("vehicle_id"));
            vehicle.setUserId(rs.getInt("user_id"));
            vehicle.setVehicleType(rs.getString("vehicle_type"));
            vehicle.setRegistrationNo(rs.getString("registration_no"));
            vehicle.setBatteryCapacity(rs.getDouble("battery_capacity"));
            vehicle.setCurrentBattery(rs.getDouble("current_battery"));
            vehicle.setQrIdentifier(rs.getString("qr_identifier"));
            vehicle.setStatus(rs.getString("status"));
            Timestamp ts = rs.getTimestamp("created_at");
            if (ts != null) {
                vehicle.setCreatedAt(ts.toLocalDateTime());
            }

            // Optional columns if joined with users
            try {
                vehicle.setOwnerName(rs.getString("owner_name"));
            } catch (SQLException ignored) {}
            try {
                vehicle.setOwnerEmail(rs.getString("owner_email"));
            } catch (SQLException ignored) {}

            return vehicle;
        }
    }

    public Vehicle registerVehicle(Vehicle vehicle) {
        String sql = "INSERT INTO vehicles (user_id, vehicle_type, registration_no, battery_capacity, " +
                "current_battery, qr_identifier, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, vehicle.getUserId());
            ps.setString(2, vehicle.getVehicleType());
            ps.setString(3, vehicle.getRegistrationNo());
            ps.setDouble(4, vehicle.getBatteryCapacity());
            ps.setDouble(5, vehicle.getCurrentBattery());
            ps.setString(6, vehicle.getQrIdentifier());
            ps.setString(7, vehicle.getStatus() != null ? vehicle.getStatus() : "ACTIVE");
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            vehicle.setVehicleId(keyHolder.getKey().intValue());
        }
        return vehicle;
    }

    public List<Vehicle> getAllVehicles() {
        String sql = "SELECT v.vehicle_id, v.user_id, v.vehicle_type, v.registration_no, " +
                "v.battery_capacity, v.current_battery, v.qr_identifier, v.status, v.created_at, " +
                "u.name AS owner_name, u.email AS owner_email " +
                "FROM vehicles v " +
                "JOIN users u ON v.user_id = u.user_id " +
                "ORDER BY v.vehicle_id ASC";
        return jdbcTemplate.query(sql, new VehicleRowMapper());
    }

    public Optional<Vehicle> getVehicleById(int vehicleId) {
        String sql = "SELECT v.vehicle_id, v.user_id, v.vehicle_type, v.registration_no, " +
                "v.battery_capacity, v.current_battery, v.qr_identifier, v.status, v.created_at, " +
                "u.name AS owner_name, u.email AS owner_email " +
                "FROM vehicles v " +
                "JOIN users u ON v.user_id = u.user_id " +
                "WHERE v.vehicle_id = ?";
        try {
            Vehicle vehicle = jdbcTemplate.queryForObject(sql, new VehicleRowMapper(), vehicleId);
            return Optional.ofNullable(vehicle);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Vehicle> findVehicleByQrIdentifier(String qrIdentifier) {
        String sql = "SELECT v.vehicle_id, v.user_id, v.vehicle_type, v.registration_no, " +
                "v.battery_capacity, v.current_battery, v.qr_identifier, v.status, v.created_at, " +
                "u.name AS owner_name, u.email AS owner_email " +
                "FROM vehicles v " +
                "JOIN users u ON v.user_id = u.user_id " +
                "WHERE v.qr_identifier = ?";
        try {
            Vehicle vehicle = jdbcTemplate.queryForObject(sql, new VehicleRowMapper(), qrIdentifier);
            return Optional.ofNullable(vehicle);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean updateBatteryPercentage(int vehicleId, double currentBattery) {
        String sql = "UPDATE vehicles SET current_battery = ? WHERE vehicle_id = ?";
        int updatedRows = jdbcTemplate.update(sql, currentBattery, vehicleId);
        return updatedRows > 0;
    }

    public boolean updateVehicleStatus(int vehicleId, String status) {
        String sql = "UPDATE vehicles SET status = ? WHERE vehicle_id = ?";
        int updatedRows = jdbcTemplate.update(sql, status, vehicleId);
        return updatedRows > 0;
    }

    public boolean existsByRegistrationNo(String regNo) {
        String sql = "SELECT COUNT(*) FROM vehicles WHERE registration_no = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, regNo);
        return count != null && count > 0;
    }

    public boolean existsByQrIdentifier(String qrIdentifier) {
        String sql = "SELECT COUNT(*) FROM vehicles WHERE qr_identifier = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, qrIdentifier);
        return count != null && count > 0;
    }
}
