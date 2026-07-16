package com.fptu.fcms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.RegisterRequest;
import com.fptu.fcms.dto.request.UpdateProfileRequest;
import com.fptu.fcms.dto.request.VerifyOTPRequest;
import com.fptu.fcms.entity.OTPVerification;
import com.fptu.fcms.repository.OTPVerificationRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class OtherControllersIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OTPVerificationRepository otpVerificationRepository;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCompleteAuthAndProfileFlow() throws Exception {
        String testEmail = "test_integration_user@fpt.edu.vn";
        String testPassword = "MySecurePassword123!";

        // 1. Register a new user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail(testEmail);
        registerRequest.setPassword(testPassword);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng ký tài khoản thành công! Vui lòng kiểm tra email để nhận mã OTP."));

        OTPVerification otp = otpVerificationRepository
                .findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(testEmail)
                .orElseThrow(() -> new AssertionError("OTP was not created for registered user"));
        VerifyOTPRequest verifyRequest = new VerifyOTPRequest();
        verifyRequest.setEmail(testEmail);
        verifyRequest.setOtpCode(otp.getOtpCode());

        mockMvc.perform(post("/api/auth/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testEmail));

        // 2. Login after OTP verification to get JWT Token
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(testEmail);
        loginRequest.setPassword(testPassword);

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn().getResponse().getContentAsString();

        String token = JsonPath.read(loginResponse, "$.token");
        String authHeader = "Bearer " + token;

        // 3. GET /api/user/profile with JWT Token
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testEmail))
                .andExpect(jsonPath("$.fullName").value("Chưa cập nhật"))
                .andExpect(jsonPath("$.roleId").value(3)); // Student default is 3

        // 4. PUT /api/user/profile to update info
        UpdateProfileRequest updateRequest = new UpdateProfileRequest();
        updateRequest.setFullName("Nguyen Van Integration Test");
        updateRequest.setMajor("Software Engineering");
        updateRequest.setPhoneNumber("0912345678");
        mockMvc.perform(put("/api/user/profile")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật hồ sơ thành công!"))
                .andExpect(jsonPath("$.fullName").value("Nguyen Van Integration Test"))
                .andExpect(jsonPath("$.major").value("Software Engineering"))
                .andExpect(jsonPath("$.phone").value("0912345678"));

        // 5. GET /api/clubs/1/board - verify it works with the token
        // (Can return 200 or 409 depending on whether active semester exists, but should not throw 500/403)
        mockMvc.perform(get("/api/clubs/1/board")
                .header("Authorization", authHeader))
                .andExpect(status().is(org.hamcrest.Matchers.oneOf(200, 409)));
    }
}
