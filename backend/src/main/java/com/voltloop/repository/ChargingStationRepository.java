package com.voltloop.repository;

import com.voltloop.model.ChargingStation;
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
public class ChargingStationRepository {

    private final JdbcTemplate jdbcTemplate;

    public ChargingStationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static class ChargingStationRowMapper implements RowMapper<ChargingStation> {
        @Override
        public ChargingStation mapRow(ResultSet rs, int rowNum) throws SQLException {
            ChargingStation station = new ChargingStation();
            station.setStationId(rs.getInt("station_id"));
            try {
                int ownerId = rs.getInt("owner_id");
                if (!rs.wasNull()) {
                    station.setOwnerId(ownerId);
                }
            } catch (SQLException ignored) {}
            station.setStationName(rs.getString("station_name"));
            station.setLocation(rs.getString("location"));
            station.setChargerType(rs.getString("charger_type"));
            station.setPowerRating(rs.getDouble("power_rating"));
            station.setConnectorType(rs.getString("connector_type"));
            station.setStatus(rs.getString("status"));
            try {
                station.setQrCode(rs.getString("qr_code"));
            } catch (SQLException ignored) {}
            Timestamp ts = rs.getTimestamp("created_at");
            if (ts != null) {
                station.setCreatedAt(ts.toLocalDateTime());
            }
            return station;
        }
    }

    public ChargingStation createStation(ChargingStation station) {
        String sql = "INSERT INTO charging_stations (owner_id, station_name, location, charger_type, power_rating, connector_type, status, qr_code) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            if (station.getOwnerId() != null) {
                ps.setInt(1, station.getOwnerId());
            } else {
                ps.setNull(1, java.sql.Types.INTEGER);
            }
            ps.setString(2, station.getStationName());
            ps.setString(3, station.getLocation());
            ps.setString(4, station.getChargerType());
            ps.setDouble(5, station.getPowerRating());
            ps.setString(6, station.getConnectorType());
            ps.setString(7, station.getStatus() != null ? station.getStatus() : "AVAILABLE");
            ps.setString(8, station.getQrCode());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            station.setStationId(keyHolder.getKey().intValue());
        }
        return station;
    }

    public List<ChargingStation> getAllStations() {
        String sql = "SELECT station_id, owner_id, station_name, location, charger_type, power_rating, connector_type, status, qr_code, created_at " +
                "FROM charging_stations ORDER BY station_id ASC";
        return jdbcTemplate.query(sql, new ChargingStationRowMapper());
    }

    public List<ChargingStation> getStationsByOwnerId(int ownerId) {
        String sql = "SELECT station_id, owner_id, station_name, location, charger_type, power_rating, connector_type, status, qr_code, created_at " +
                "FROM charging_stations WHERE owner_id = ? ORDER BY station_id ASC";
        return jdbcTemplate.query(sql, new ChargingStationRowMapper(), ownerId);
    }

    public List<ChargingStation> getAvailableStations() {
        String sql = "SELECT station_id, owner_id, station_name, location, charger_type, power_rating, connector_type, status, qr_code, created_at " +
                "FROM charging_stations WHERE status = 'AVAILABLE' ORDER BY power_rating DESC";
        return jdbcTemplate.query(sql, new ChargingStationRowMapper());
    }

    public Optional<ChargingStation> getStationById(int stationId) {
        String sql = "SELECT station_id, owner_id, station_name, location, charger_type, power_rating, connector_type, status, qr_code, created_at " +
                "FROM charging_stations WHERE station_id = ?";
        try {
            ChargingStation station = jdbcTemplate.queryForObject(sql, new ChargingStationRowMapper(), stationId);
            return Optional.ofNullable(station);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<ChargingStation> findStationByQrCode(String qrCode) {
        if (qrCode == null) return Optional.empty();
        String sql = "SELECT station_id, owner_id, station_name, location, charger_type, power_rating, connector_type, status, qr_code, created_at " +
                "FROM charging_stations WHERE UPPER(qr_code) = UPPER(?)";
        try {
            ChargingStation station = jdbcTemplate.queryForObject(sql, new ChargingStationRowMapper(), qrCode.trim());
            return Optional.ofNullable(station);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean updateStationStatus(int stationId, String status) {
        String sql = "UPDATE charging_stations SET status = ? WHERE station_id = ?";
        int updatedRows = jdbcTemplate.update(sql, status, stationId);
        return updatedRows > 0;
    }

    public boolean existsByName(String stationName) {
        String sql = "SELECT COUNT(*) FROM charging_stations WHERE station_name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, stationName);
        return count != null && count > 0;
    }
}
