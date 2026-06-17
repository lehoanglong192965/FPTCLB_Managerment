package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.RegisterRequest;
import com.fptu.fcms.dto.request.VerifyOTPRequest;
import com.fptu.fcms.dto.response.AuthResponse;
import com.fptu.fcms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            AuthResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(Map.of(
                "message", "Đăng ký tài khoản thành công! Vui lòng kiểm tra email để nhận mã OTP.",
                "email", request.getEmail()
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@RequestBody VerifyOTPRequest request) {
        authService.verifyOTPAndActivateAccount(request);
        return ResponseEntity.ok(Map.of(
                "message", "Xác thực thành công! Tài khoản của bạn đã được kích hoạt.",
                "email", request.getEmail()
        ));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOTP(@RequestParam String email) {
        authService.resendOTP(email);
        return ResponseEntity.ok(Map.of(
                "message", "Mã OTP đã được gửi lại. Vui lòng kiểm tra email của bạn.",
                "email", email
        ));
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công!"));
    }
}