package com.voltloop.model;

public class LoginResponse {
    private String token;
    private User user;
    private String portal; // OWNER or CUSTOMER
    private String message;

    public LoginResponse() {
    }

    public LoginResponse(String token, User user, String portal, String message) {
        this.token = token;
        this.user = user;
        this.portal = portal;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getPortal() {
        return portal;
    }

    public void setPortal(String portal) {
        this.portal = portal;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
