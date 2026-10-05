package com.voltloop.repository;

import com.voltloop.model.ChargingSession;
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
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ChargingSessionRepository {

    private final JdbcTemplate jdbcTemplate;

    public ChargingSessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static class SessionRowMapper implements RowMapper<ChargingSession> {
        @Override
        public ChargingSession mapRow(ResultSet rs, int rowNum) throws SQLException {
            ChargingSession session = new ChargingSession();
            session.setSessionId(rs.getInt("session_id"));
            session.setVehicleId(rs.getInt("vehicle_id"));
            session.setStationId(rs.getInt("station_id"));

            int resId = rs.getInt("reservation_id");
            if (!rs.wasNull()) {
                session.setReservationId(resId);
            }

            Timestamp startTs = rs.getTimestamp("start_time");
            if (startTs != null) {
                session.setStartTime(startTs.toLocalDateTime());
            }
            Timestamp endTs = rs.getTimestamp("end_time");
            if (endTs != null) {
                session.setEndTime(endTs.toLocalDateTime());
            }

            session.setInitialBattery(rs.getDouble("initial_battery"));
            double finalBat = rs.getDouble("final_battery");
            if (!rs.wasNull()) {
                session.setFinalBattery(finalBat);
            }

            session.setEnergyConsumed(rs.getDouble("energy_consumed"));
            session.setChargingCost(rs.getDouble("charging_cost"));
            session.setStatus(rs.getString("status"));

            Timestamp createdTs = rs.getTimestamp("created_at");
            if (createdTs != null) {
                session.setCreatedAt(createdTs.toLocalDateTime());
            }

            try {
                session.setRegistrationNo(rs.getString("registration_no"));
            } catch (SQLException ignored) {}
            try {
                session.setQrIdentifier(rs.getString("qr_identifier"));
            } catch (SQLException ignored) {}
            try {
                session.setVehicleType(rs.getString("vehicle_type"));
            } catch (SQLException ignored) {}
            try {
                session.setStationName(rs.getString("station_name"));
            } catch (SQLException ignored) {}
            try {
                session.setStationLocation(rs.getString("location"));
            } catch (SQLException ignored) {}

            return session;
        }
    }

    public ChargingSession startChargingSession(ChargingSession session) {
        String sql = "INSERT INTO charging_sessions (vehicle_id, station_id, reservation_id, start_time, " +
                "initial_battery, energy_consumed, charging_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, session.getVehicleId());
            ps.setInt(2, session.getStationId());
            if (session.getReservationId() != null) {
                ps.setInt(3, session.getReservationId());
            } else {
                ps.setNull(3, Types.INTEGER);
            }
            ps.setTimestamp(4, Timestamp.valueOf(session.getStartTime() != null ? session.getStartTime() : LocalDateTime.now()));
            ps.setDouble(5, session.getInitialBattery());
            ps.setDouble(6, session.getEnergyConsumed() != null ? session.getEnergyConsumed() : 0.00);
            ps.setDouble(7, session.getChargingCost() != null ? session.getChargingCost() : 0.00);
            ps.setString(8, "ACTIVE");
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            session.setSessionId(keyHolder.getKey().intValue());
            session.setStatus("ACTIVE");
        }
        return session;
    }

    public boolean completeChargingSession(int sessionId, LocalDateTime endTime, double finalBattery,
                                          double energyConsumed, double cost) {
        String sql = "UPDATE charging_sessions SET end_time = ?, final_battery = ?, energy_consumed = ?, " +
                "charging_cost = ?, status = 'COMPLETED' WHERE session_id = ?";
        int updatedRows = jdbcTemplate.update(sql,
                Timestamp.valueOf(endTime),
                finalBattery,
                energyConsumed,
                cost,
                sessionId
        );
        return updatedRows > 0;
    }

    public List<ChargingSession> getAllSessions() {
        String sql = "SELECT s.*, v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location " +
                "FROM charging_sessions s " +
                "JOIN vehicles v ON s.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON s.station_id = cs.station_id " +
                "ORDER BY s.start_time DESC";
        return jdbcTemplate.query(sql, new SessionRowMapper());
    }

    public List<ChargingSession> getActiveChargingSessions() {
        String sql = "SELECT s.*, v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location " +
                "FROM charging_sessions s " +
                "JOIN vehicles v ON s.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON s.station_id = cs.station_id " +
                "WHERE s.status = 'ACTIVE' " +
                "ORDER BY s.start_time DESC";
        return jdbcTemplate.query(sql, new SessionRowMapper());
    }

    public List<ChargingSession> getChargingHistoryByVehicle(int vehicleId) {
        String sql = "SELECT s.*, v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location " +
                "FROM charging_sessions s " +
                "JOIN vehicles v ON s.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON s.station_id = cs.station_id " +
                "WHERE s.vehicle_id = ? " +
                "ORDER BY s.start_time DESC";
        return jdbcTemplate.query(sql, new SessionRowMapper(), vehicleId);
    }

    public Optional<ChargingSession> getSessionById(int sessionId) {
        String sql = "SELECT s.*, v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location " +
                "FROM charging_sessions s " +
                "JOIN vehicles v ON s.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON s.station_id = cs.station_id " +
                "WHERE s.session_id = ?";
        try {
            ChargingSession session = jdbcTemplate.queryForObject(sql, new SessionRowMapper(), sessionId);
            return Optional.ofNullable(session);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<ChargingSession> findActiveSessionByVehicleId(int vehicleId) {
        String sql = "SELECT s.*, v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location " +
                "FROM charging_sessions s " +
                "JOIN vehicles v ON s.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON s.station_id = cs.station_id " +
                "WHERE s.vehicle_id = ? AND s.status = 'ACTIVE'";
        try {
            ChargingSession session = jdbcTemplate.queryForObject(sql, new SessionRowMapper(), vehicleId);
            return Optional.ofNullable(session);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
