package com.voltloop.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getAnalyticsSummary() {
        Map<String, Object> analytics = new HashMap<>();

        // Aggregates across charging sessions
        Double totalEnergy = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(energy_consumed), 0) FROM charging_sessions", Double.class);
        Integer totalSessions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM charging_sessions", Integer.class);
        Integer activeSessions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM charging_sessions WHERE status = 'ACTIVE'", Integer.class);
        Integer completedSessions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM charging_sessions WHERE status = 'COMPLETED'", Integer.class);
        Double totalCost = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(charging_cost), 0) FROM charging_sessions", Double.class);
        Double avgDuration = jdbcTemplate.queryForObject(
                "SELECT COALESCE(AVG(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) FROM charging_sessions WHERE status = 'COMPLETED' AND end_time IS NOT NULL", Double.class);

        // Fleet & Stations overview
        Integer totalVehicles = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vehicles", Integer.class);
        Integer totalStations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM charging_stations", Integer.class);
        Integer availableStations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM charging_stations WHERE status = 'AVAILABLE'", Integer.class);
        Double todayEnergy = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(energy_consumed), 0) FROM charging_sessions WHERE DATE(start_time) = CURRENT_DATE()", Double.class);

        analytics.put("totalEnergyConsumed", Math.round((totalEnergy != null ? totalEnergy : 0.0) * 100.0) / 100.0);
        analytics.put("totalChargingSessions", totalSessions != null ? totalSessions : 0);
        analytics.put("activeSessionsCount", activeSessions != null ? activeSessions : 0);
        analytics.put("completedSessionsCount", completedSessions != null ? completedSessions : 0);
        analytics.put("totalChargingCost", Math.round((totalCost != null ? totalCost : 0.0) * 100.0) / 100.0);
        analytics.put("averageDurationMinutes", Math.round((avgDuration != null ? avgDuration : 0.0) * 10.0) / 10.0);
        analytics.put("totalVehicles", totalVehicles != null ? totalVehicles : 0);
        analytics.put("totalStations", totalStations != null ? totalStations : 0);
        analytics.put("availableStations", availableStations != null ? availableStations : 0);
        analytics.put("todayEnergyConsumed", Math.round((todayEnergy != null ? todayEnergy : 0.0) * 100.0) / 100.0);

        // Station utilization breakdown
        String stationSql = "SELECT cs.station_id, cs.station_name, cs.location, cs.power_rating, cs.connector_type, cs.status, " +
                "COUNT(s.session_id) as session_count, " +
                "COALESCE(SUM(s.energy_consumed), 0) as total_energy, " +
                "COALESCE(SUM(s.charging_cost), 0) as total_cost " +
                "FROM charging_stations cs " +
                "LEFT JOIN charging_sessions s ON cs.station_id = s.station_id " +
                "GROUP BY cs.station_id, cs.station_name, cs.location, cs.power_rating, cs.connector_type, cs.status " +
                "ORDER BY total_energy DESC";

        List<Map<String, Object>> stationUtilization = jdbcTemplate.query(stationSql, (rs, rowNum) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("stationId", rs.getInt("station_id"));
            map.put("stationName", rs.getString("station_name"));
            map.put("location", rs.getString("location"));
            map.put("powerRating", rs.getDouble("power_rating"));
            map.put("connectorType", rs.getString("connector_type"));
            map.put("status", rs.getString("status"));
            map.put("sessionCount", rs.getInt("session_count"));
            map.put("totalEnergy", Math.round(rs.getDouble("total_energy") * 100.0) / 100.0);
            map.put("totalCost", Math.round(rs.getDouble("total_cost") * 100.0) / 100.0);
            return map;
        });
        analytics.put("stationUtilization", stationUtilization);

        // Daily energy consumption trend
        String dailySql = "SELECT DATE_FORMAT(start_time, '%Y-%m-%d') as log_date, " +
                "COALESCE(SUM(energy_consumed), 0) as daily_energy, " +
                "COUNT(*) as session_count, " +
                "COALESCE(SUM(charging_cost), 0) as daily_cost " +
                "FROM charging_sessions " +
                "GROUP BY DATE_FORMAT(start_time, '%Y-%m-%d') " +
                "ORDER BY log_date ASC";

        List<Map<String, Object>> dailyEnergy = jdbcTemplate.query(dailySql, (rs, rowNum) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("date", rs.getString("log_date"));
            map.put("energyConsumed", Math.round(rs.getDouble("daily_energy") * 100.0) / 100.0);
            map.put("sessionCount", rs.getInt("session_count"));
            map.put("chargingCost", Math.round(rs.getDouble("daily_cost") * 100.0) / 100.0);
            return map;
        });
        analytics.put("dailyEnergyConsumption", dailyEnergy);

        return analytics;
    }
}
