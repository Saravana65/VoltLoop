package com.voltloop.repository;

import com.voltloop.model.Payment;
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
public class PaymentRepository {

    private final JdbcTemplate jdbcTemplate;

    public PaymentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static class PaymentRowMapper implements RowMapper<Payment> {
        @Override
        public Payment mapRow(ResultSet rs, int rowNum) throws SQLException {
            Payment payment = new Payment();
            payment.setPaymentId(rs.getInt("payment_id"));
            payment.setUserId(rs.getInt("user_id"));

            int sessId = rs.getInt("session_id");
            if (!rs.wasNull()) payment.setSessionId(sessId);

            int resId = rs.getInt("reservation_id");
            if (!rs.wasNull()) payment.setReservationId(resId);

            int stId = rs.getInt("station_id");
            if (!rs.wasNull()) payment.setStationId(stId);

            payment.setAmount(rs.getDouble("amount"));
            payment.setCurrency(rs.getString("currency"));
            payment.setPaymentMethod(rs.getString("payment_method"));
            payment.setTransactionRef(rs.getString("transaction_ref"));
            payment.setStatus(rs.getString("status"));
            payment.setSimulated(rs.getBoolean("simulated"));

            Timestamp createdTs = rs.getTimestamp("created_at");
            if (createdTs != null) payment.setCreatedAt(createdTs.toLocalDateTime());

            Timestamp completedTs = rs.getTimestamp("completed_at");
            if (completedTs != null) payment.setCompletedAt(completedTs.toLocalDateTime());

            // Enriched joined fields
            try { payment.setUserName(rs.getString("user_name")); } catch (SQLException ignored) {}
            try { payment.setUserEmail(rs.getString("user_email")); } catch (SQLException ignored) {}
            try { payment.setUserPhone(rs.getString("user_phone")); } catch (SQLException ignored) {}
            try { payment.setStationName(rs.getString("station_name")); } catch (SQLException ignored) {}
            try { payment.setStationLocation(rs.getString("station_location")); } catch (SQLException ignored) {}
            try { payment.setRegistrationNo(rs.getString("registration_no")); } catch (SQLException ignored) {}
            try { payment.setVehicleType(rs.getString("vehicle_type")); } catch (SQLException ignored) {}
            try {
                double ec = rs.getDouble("energy_consumed");
                if (!rs.wasNull()) payment.setEnergyConsumed(ec);
            } catch (SQLException ignored) {}
            try {
                Timestamp sStart = rs.getTimestamp("session_start_time");
                if (sStart != null) payment.setSessionStartTime(sStart.toLocalDateTime());
            } catch (SQLException ignored) {}
            try {
                Timestamp sEnd = rs.getTimestamp("session_end_time");
                if (sEnd != null) payment.setSessionEndTime(sEnd.toLocalDateTime());
            } catch (SQLException ignored) {}

            if (payment.getSessionStartTime() != null && payment.getSessionEndTime() != null) {
                payment.setDurationMinutes(Math.max(1L, java.time.Duration.between(payment.getSessionStartTime(), payment.getSessionEndTime()).toMinutes()));
            }

            return payment;
        }
    }

    private static final String BASE_SELECT =
            "SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, " +
            "cs.station_name, cs.location AS station_location, " +
            "v.registration_no, v.vehicle_type, s.energy_consumed, " +
            "s.start_time AS session_start_time, s.end_time AS session_end_time " +
            "FROM payments p " +
            "JOIN users u ON p.user_id = u.user_id " +
            "LEFT JOIN charging_stations cs ON p.station_id = cs.station_id " +
            "LEFT JOIN charging_sessions s ON p.session_id = s.session_id " +
            "LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id ";

    public Payment createPayment(Payment payment) {
        String sql = "INSERT INTO payments (user_id, session_id, reservation_id, station_id, amount, " +
                "currency, payment_method, transaction_ref, status, simulated, created_at, completed_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, payment.getUserId());
            if (payment.getSessionId() != null) ps.setInt(2, payment.getSessionId()); else ps.setNull(2, Types.INTEGER);
            if (payment.getReservationId() != null) ps.setInt(3, payment.getReservationId()); else ps.setNull(3, Types.INTEGER);
            if (payment.getStationId() != null) ps.setInt(4, payment.getStationId()); else ps.setNull(4, Types.INTEGER);
            ps.setDouble(5, payment.getAmount());
            ps.setString(6, payment.getCurrency() != null ? payment.getCurrency() : "INR");
            ps.setString(7, payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "SIMULATED_UPI");
            ps.setString(8, payment.getTransactionRef());
            ps.setString(9, payment.getStatus() != null ? payment.getStatus() : "PENDING");
            ps.setBoolean(10, payment.getSimulated() != null ? payment.getSimulated() : true);
            ps.setTimestamp(11, Timestamp.valueOf(payment.getCreatedAt() != null ? payment.getCreatedAt() : LocalDateTime.now()));
            if (payment.getCompletedAt() != null) ps.setTimestamp(12, Timestamp.valueOf(payment.getCompletedAt())); else ps.setNull(12, Types.TIMESTAMP);
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            payment.setPaymentId(keyHolder.getKey().intValue());
        }
        return payment;
    }

    public Optional<Payment> getPaymentById(int paymentId) {
        String sql = BASE_SELECT + "WHERE p.payment_id = ?";
        try {
            Payment payment = jdbcTemplate.queryForObject(sql, new PaymentRowMapper(), paymentId);
            return Optional.ofNullable(payment);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Payment> getPaymentByTransactionRef(String transactionRef) {
        String sql = BASE_SELECT + "WHERE p.transaction_ref = ?";
        try {
            Payment payment = jdbcTemplate.queryForObject(sql, new PaymentRowMapper(), transactionRef);
            return Optional.ofNullable(payment);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Payment> getPaymentBySessionId(int sessionId) {
        String sql = BASE_SELECT + "WHERE p.session_id = ? ORDER BY p.payment_id DESC LIMIT 1";
        try {
            Payment payment = jdbcTemplate.queryForObject(sql, new PaymentRowMapper(), sessionId);
            return Optional.ofNullable(payment);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Payment> getPaymentsByUserId(int userId) {
        String sql = BASE_SELECT + "WHERE p.user_id = ? ORDER BY p.created_at DESC";
        return jdbcTemplate.query(sql, new PaymentRowMapper(), userId);
    }

    public List<Payment> getPaymentsByStationOwnerId(int ownerId) {
        String sql = BASE_SELECT + "WHERE cs.owner_id = ? ORDER BY p.created_at DESC";
        return jdbcTemplate.query(sql, new PaymentRowMapper(), ownerId);
    }

    public List<Payment> getAllPayments() {
        String sql = BASE_SELECT + "ORDER BY p.created_at DESC";
        return jdbcTemplate.query(sql, new PaymentRowMapper());
    }

    public boolean updatePaymentStatus(int paymentId, String status, LocalDateTime completedAt) {
        String sql = "UPDATE payments SET status = ?, completed_at = ? WHERE payment_id = ?";
        int rows = jdbcTemplate.update(sql, status, completedAt != null ? Timestamp.valueOf(completedAt) : null, paymentId);
        return rows > 0;
    }

    public double getVerifiedRevenueForOwner(int ownerId) {
        String sql = "SELECT COALESCE(SUM(p.amount), 0.0) FROM payments p " +
                "JOIN charging_stations cs ON p.station_id = cs.station_id " +
                "WHERE cs.owner_id = ? AND p.status = 'SUCCESSFUL'";
        Double revenue = jdbcTemplate.queryForObject(sql, Double.class, ownerId);
        return revenue != null ? revenue : 0.0;
    }

    public double getTodayVerifiedRevenueForOwner(int ownerId) {
        String sql = "SELECT COALESCE(SUM(p.amount), 0.0) FROM payments p " +
                "JOIN charging_stations cs ON p.station_id = cs.station_id " +
                "WHERE cs.owner_id = ? AND p.status = 'SUCCESSFUL' AND DATE(p.completed_at) = CURDATE()";
        Double revenue = jdbcTemplate.queryForObject(sql, Double.class, ownerId);
        return revenue != null ? revenue : 0.0;
    }

    public double getTotalUserSpend(int userId) {
        String sql = "SELECT COALESCE(SUM(amount), 0.0) FROM payments WHERE user_id = ? AND status = 'SUCCESSFUL'";
        Double spend = jdbcTemplate.queryForObject(sql, Double.class, userId);
        return spend != null ? spend : 0.0;
    }
}
