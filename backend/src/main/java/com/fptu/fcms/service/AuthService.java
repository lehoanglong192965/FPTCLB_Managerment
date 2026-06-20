package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.RegisterRequest;
import com.fptu.fcms.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void register(RegisterRequest request);
    void verifyOTPAndActivateAccount(com.fptu.fcms.dto.request.VerifyOTPRequest request);
    void resendOTP(String email);
    void forgotPassword(String email);
    void resetPassword(com.fptu.fcms.dto.request.ResetPasswordRequest request);
}
