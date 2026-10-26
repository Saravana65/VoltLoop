package com.voltloop.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Lightweight, self-contained JWT-style HMAC-SHA256 token service.
 * Signs and validates tamper-proof tokens containing userId, email, and role.
 */
@Service
public class AuthTokenService {

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenService.class);
    private static final String HMAC_ALGO = "HmacSHA256";
    private static final long EXPIRATION_SECONDS = 7 * 24 * 3600; // 7 days

    private final String secretKey;
    private final ObjectMapper objectMapper;

    public AuthTokenService(@Value("${auth.jwt.secret:VoltLoop-Secure-Campus-Token-Signing-Key-2026-Super-Secret}") String secretKey,
                            ObjectMapper objectMapper) {
        this.secretKey = secretKey;
        this.objectMapper = objectMapper;
    }

    public static class AuthenticatedUser {
        private final int userId;
        private final String email;
        private final String role; // OWNER or CUSTOMER

        public AuthenticatedUser(int userId, String email, String role) {
            this.userId = userId;
            this.email = email;
            this.role = role != null ? role.toUpperCase() : "CUSTOMER";
        }

        public int getUserId() {
            return userId;
        }

        public String getEmail() {
            return email;
        }

        public String getRole() {
            return role;
        }

        public boolean isOwner() {
            return "OWNER".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role) || "OPERATOR".equalsIgnoreCase(role);
        }

        public boolean isCustomer() {
            return "CUSTOMER".equalsIgnoreCase(role) || "DRIVER".equalsIgnoreCase(role);
        }
    }

    public String generateToken(int userId, String email, String role) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            String encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(header));

            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", String.valueOf(userId));
            payload.put("email", email);
            payload.put("role", role != null ? role.toUpperCase() : "CUSTOMER");
            payload.put("iat", Instant.now().getEpochSecond());
            payload.put("exp", Instant.now().getEpochSecond() + EXPIRATION_SECONDS);

            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(payload));
            String dataToSign = encodedHeader + "." + encodedPayload;
            String signature = sign(dataToSign);

            return dataToSign + "." + signature;
        } catch (Exception e) {
            logger.error("Error generating authentication token", e);
            throw new RuntimeException("Failed to generate authentication token", e);
        }
    }

    public AuthenticatedUser validateAndExtractUser(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7).trim();
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }

        try {
            String dataToSign = parts[0] + "." + parts[1];
            String expectedSignature = sign(dataToSign);

            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                logger.warn("Invalid token signature detected");
                return null;
            }

            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.readValue(payloadBytes, Map.class);

            Number expNum = (Number) payload.get("exp");
            if (expNum != null && Instant.now().getEpochSecond() > expNum.longValue()) {
                logger.warn("Expired authentication token");
                return null;
            }

            int userId = Integer.parseInt(payload.get("sub").toString());
            String email = (String) payload.get("email");
            String role = (String) payload.get("role");

            return new AuthenticatedUser(userId, email, role);
        } catch (Exception e) {
            logger.warn("Failed to parse and validate token: {}", e.getMessage());
            return null;
        }
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGO);
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGO);
        mac.init(keySpec);
        byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
    }
}
