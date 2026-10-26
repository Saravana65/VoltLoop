package com.voltloop.repository;

import com.voltloop.model.ChargingReservation;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ChargingReservationRepository {

    private final JdbcTemplate jdbcTemplate;

    public ChargingReservationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static class ReservationRowMapper implements RowMapper<ChargingReservation> {
        @Override
        public ChargingReservation mapRow(ResultSet rs, int rowNum) throws SQLException {
            ChargingReservation res = new ChargingReservation();
            res.setReservationId(rs.getInt("reservation_id"));
            try {
                int uid = rs.getInt("user_id");
                if (!rs.wasNull()) res.setUserId(uid);
            } catch (SQLException ignored) {}
            res.setVehicleId(rs.getInt("vehicle_id"));
            res.setStationId(rs.getInt("station_id"));
            Timestamp startTs = rs.getTimestamp("start_time");
            if (startTs != null) {
                res.setStartTime(startTs.toLocalDateTime());
            }
            Timestamp endTs = rs.getTimestamp("end_time");
            if (endTs != null) {
                res.setEndTime(endTs.toLocalDateTime());
            }
            res.setStatus(rs.getString("status"));
            Timestamp createdTs = rs.getTimestamp("created_at");
            if (createdTs != null) {
                res.setCreatedAt(createdTs.toLocalDateTime());
            }

            try { res.setUserName(rs.getString("user_name")); } catch (SQLException ignored) {}
            try { res.setUserEmail(rs.getString("user_email")); } catch (SQLException ignored) {}
            try { res.setRegistrationNo(rs.getString("registration_no")); } catch (SQLException ignored) {}
            try { res.setQrIdentifier(rs.getString("qr_identifier")); } catch (SQLException ignored) {}
            try { res.setVehicleType(rs.getString("vehicle_type")); } catch (SQLException ignored) {}
            try { res.setStationName(rs.getString("station_name")); } catch (SQLException ignored) {}
            try { res.setStationLocation(rs.getString("location")); } catch (SQLException ignored) {}
            try { res.setConnectorType(rs.getString("connector_type")); } catch (SQLException ignored) {}
            try {
                double pr = rs.getDouble("power_rating");
                if (!rs.wasNull()) res.setPowerRating(pr);
            } catch (SQLException ignored) {}

            return res;
        }
    }

    public ChargingReservation createReservation(ChargingReservation reservation) {
        String sql = "INSERT INTO charging_reservations (user_id, vehicle_id, station_id, start_time, end_time, status) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            if (reservation.getUserId() != null) {
                ps.setInt(1, reservation.getUserId());
            } else {
                ps.setNull(1, java.sql.Types.INTEGER);
            }
            ps.setInt(2, reservation.getVehicleId());
            ps.setInt(3, reservation.getStationId());
            ps.setTimestamp(4, Timestamp.valueOf(reservation.getStartTime()));
            ps.setTimestamp(5, Timestamp.valueOf(reservation.getEndTime()));
            ps.setString(6, reservation.getStatus() != null ? reservation.getStatus() : "RESERVED");
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            reservation.setReservationId(keyHolder.getKey().intValue());
        }
        return reservation;
    }

    public List<ChargingReservation> getAllReservations() {
        String sql = "SELECT r.reservation_id, r.user_id, r.vehicle_id, r.station_id, r.start_time, r.end_time, " +
                "r.status, r.created_at, u.name AS user_name, u.email AS user_email, " +
                "v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location, " +
                "cs.connector_type, cs.power_rating " +
                "FROM charging_reservations r " +
                "LEFT JOIN users u ON r.user_id = u.user_id " +
                "JOIN vehicles v ON r.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON r.station_id = cs.station_id " +
                "ORDER BY r.start_time DESC";
        return jdbcTemplate.query(sql, new ReservationRowMapper());
    }

    public List<ChargingReservation> getReservationsByUserId(int userId) {
        String sql = "SELECT r.reservation_id, r.user_id, r.vehicle_id, r.station_id, r.start_time, r.end_time, " +
                "r.status, r.created_at, u.name AS user_name, u.email AS user_email, " +
                "v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location, " +
                "cs.connector_type, cs.power_rating " +
                "FROM charging_reservations r " +
                "LEFT JOIN users u ON r.user_id = u.user_id " +
                "JOIN vehicles v ON r.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON r.station_id = cs.station_id " +
                "WHERE r.user_id = ? " +
                "ORDER BY r.start_time DESC";
        return jdbcTemplate.query(sql, new ReservationRowMapper(), userId);
    }

    public List<ChargingReservation> getReservationsByStationOwnerId(int ownerId) {
        String sql = "SELECT r.reservation_id, r.user_id, r.vehicle_id, r.station_id, r.start_time, r.end_time, " +
                "r.status, r.created_at, u.name AS user_name, u.email AS user_email, " +
                "v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location, " +
                "cs.connector_type, cs.power_rating " +
                "FROM charging_reservations r " +
                "LEFT JOIN users u ON r.user_id = u.user_id " +
                "JOIN vehicles v ON r.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON r.station_id = cs.station_id " +
                "WHERE cs.owner_id = ? " +
                "ORDER BY r.start_time DESC";
        return jdbcTemplate.query(sql, new ReservationRowMapper(), ownerId);
    }

    public Optional<ChargingReservation> getReservationById(int reservationId) {
        String sql = "SELECT r.reservation_id, r.user_id, r.vehicle_id, r.station_id, r.start_time, r.end_time, " +
                "r.status, r.created_at, u.name AS user_name, u.email AS user_email, " +
                "v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location, " +
                "cs.connector_type, cs.power_rating " +
                "FROM charging_reservations r " +
                "LEFT JOIN users u ON r.user_id = u.user_id " +
                "JOIN vehicles v ON r.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON r.station_id = cs.station_id " +
                "WHERE r.reservation_id = ?";
        try {
            ChargingReservation res = jdbcTemplate.queryForObject(sql, new ReservationRowMapper(), reservationId);
            return Optional.ofNullable(res);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean cancelReservation(int reservationId) {
        String sql = "UPDATE charging_reservations SET status = 'CANCELLED' WHERE reservation_id = ?";
        int updatedRows = jdbcTemplate.update(sql, reservationId);
        return updatedRows > 0;
    }

    public List<ChargingReservation> findOverlappingReservations(int stationId, LocalDateTime start, LocalDateTime end) {
        String sql = "SELECT r.reservation_id, r.user_id, r.vehicle_id, r.station_id, r.start_time, r.end_time, " +
                "r.status, r.created_at, u.name AS user_name, u.email AS user_email, " +
                "v.registration_no, v.qr_identifier, v.vehicle_type, cs.station_name, cs.location, " +
                "cs.connector_type, cs.power_rating " +
                "FROM charging_reservations r " +
                "LEFT JOIN users u ON r.user_id = u.user_id " +
                "JOIN vehicles v ON r.vehicle_id = v.vehicle_id " +
                "JOIN charging_stations cs ON r.station_id = cs.station_id " +
                "WHERE r.station_id = ? " +
                "AND r.status IN ('RESERVED', 'ACTIVE') " +
                "AND r.start_time < ? AND r.end_time > ?";
        return jdbcTemplate.query(sql, new ReservationRowMapper(),
                stationId, Timestamp.valueOf(end), Timestamp.valueOf(start));
    }
}
