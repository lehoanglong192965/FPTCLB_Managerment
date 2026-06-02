package com.fptu.fcms.dto.request;

public class LoginRequest {
    private String email;
    private String password;
    // Thêm các trường khác nếu UI của bạn yêu cầu lúc đăng ký, ví dụ:
    // private String fullName;
    // private String major;

    // Getters
    public String getEmail() {
        return email;
    }   

    public String getPassword() {
        return password;
    }

    // Setters
    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}