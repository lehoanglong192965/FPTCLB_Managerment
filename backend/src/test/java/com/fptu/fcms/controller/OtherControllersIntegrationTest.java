package com.fptu.fcms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.UpdateProfileRequest;
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
        LoginRequest registerRequest = new LoginRequest();
        registerRequest.setEmail(testEmail);
        registerRequest.setPassword(testPassword);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng ký tài khoản thành công!"));

        // 2. Login to get JWT Token
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(testEmail);
        loginRequest.setPassword(testPassword);

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("Bearer"))
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

        mockMvc.perform(put("/api/user/profile")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật hồ sơ thành công!"))
                .andExpect(jsonPath("$.fullName").value("Nguyen Van Integration Test"))
                .andExpect(jsonPath("$.major").value("Software Engineering"));

        // 5. GET /api/clubs/1/board - verify it works with the token
        // (Can return 200 or 409 depending on whether active semester exists, but should not throw 500/403)
        mockMvc.perform(get("/api/clubs/1/board")
                .header("Authorization", authHeader))
                .andExpect(status().is(org.hamcrest.Matchers.oneOf(200, 409)));
    }
}
