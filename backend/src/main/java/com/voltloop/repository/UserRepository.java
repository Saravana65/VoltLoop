package com.voltloop.repository;

import com.voltloop.model.User;
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
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setUserId(rs.getInt("user_id"));
            user.setName(rs.getString("name"));
            user.setEmail(rs.getString("email"));
            try {
                user.setPasswordHash(rs.getString("password_hash"));
            } catch (SQLException ignored) {}
            user.setRole(rs.getString("role"));
            try {
                user.setPhone(rs.getString("phone"));
            } catch (SQLException ignored) {}
            user.setStatus(rs.getString("status"));
            Timestamp ts = rs.getTimestamp("created_at");
            if (ts != null) {
                user.setCreatedAt(ts.toLocalDateTime());
            }
            return user;
        }
    }

    public User createUser(User user) {
        String sql = "INSERT INTO users (name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail().toLowerCase().trim());
            ps.setString(3, user.getPasswordHash());
            ps.setString(4, user.getRole() != null ? user.getRole().toUpperCase() : "CUSTOMER");
            ps.setString(5, user.getPhone());
            ps.setString(6, user.getStatus() != null ? user.getStatus().toUpperCase() : "ACTIVE");
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            user.setUserId(keyHolder.getKey().intValue());
        }
        return user;
    }

    public List<User> getAllUsers() {
        String sql = "SELECT user_id, name, email, password_hash, role, phone, status, created_at FROM users ORDER BY user_id ASC";
        return jdbcTemplate.query(sql, new UserRowMapper());
    }

    public Optional<User> getUserById(int userId) {
        String sql = "SELECT user_id, name, email, password_hash, role, phone, status, created_at FROM users WHERE user_id = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, new UserRowMapper(), userId);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findByEmail(String email) {
        if (email == null) return Optional.empty();
        String sql = "SELECT user_id, name, email, password_hash, role, phone, status, created_at FROM users WHERE LOWER(email) = LOWER(?)";
        try {
            User user = jdbcTemplate.queryForObject(sql, new UserRowMapper(), email.trim());
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void updateProfile(int userId, String name, String phone) {
        String sql = "UPDATE users SET name = ?, phone = ? WHERE user_id = ?";
        jdbcTemplate.update(sql, name, phone, userId);
    }

    public void updatePassword(int userId, String passwordHash) {
        String sql = "UPDATE users SET password_hash = ? WHERE user_id = ?";
        jdbcTemplate.update(sql, passwordHash, userId);
    }
}
