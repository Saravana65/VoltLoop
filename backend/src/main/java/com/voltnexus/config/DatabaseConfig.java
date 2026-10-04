package com.voltnexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

/**
 * JDBC Configuration and connection health check.
 * Pure JDBC DataSource and JdbcTemplate initialization.
 */
@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    /**
     * Diagnostic startup runner that verifies JDBC connection to MySQL.
     */
    @Bean
    public CommandLineRunner databaseConnectionVerifier(DataSource dataSource) {
        return args -> {
            logger.info("=============================================================");
            logger.info("VoltNexus: Initializing JDBC Database Connectivity Check...");
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                logger.info("JDBC Connection Successful!");
                logger.info("Database Product : {}", metaData.getDatabaseProductName());
                logger.info("Database Version : {}", metaData.getDatabaseProductVersion());
                logger.info("Driver Name      : {}", metaData.getDriverName());
                logger.info("Driver Version   : {}", metaData.getDriverVersion());
                logger.info("Connected URL    : {}", metaData.getURL());
                logger.info("=============================================================");
            } catch (Exception e) {
                logger.error("JDBC Connection Failed! Please verify MySQL container is running on localhost:3306", e);
                logger.info("=============================================================");
            }
        };
    }
}
