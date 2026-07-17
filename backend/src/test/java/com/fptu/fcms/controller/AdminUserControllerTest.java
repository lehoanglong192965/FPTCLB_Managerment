package com.fptu.fcms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.CreateIcpdpRequest;
import com.fptu.fcms.dto.response.ProvisionIcpdpResponse;
import com.fptu.fcms.enums.ProvisionIcpdpAction;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AdminUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminUserService adminUserService;

    private CreateIcpdpRequest validRequest;
    private UserPrincipal adminPrincipal;
    private UserPrincipal memberPrincipal;

    @BeforeEach
    void setUp() {
        validRequest = new CreateIcpdpRequest("test@gmail.com", "Test User");
        adminPrincipal = new UserPrincipal(100, "admin@fpt.edu.vn", 1, 
            Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_Admin")));
        memberPrincipal = new UserPrincipal(200, "student@fpt.edu.vn", 3, 
            Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_Student")));
    }

    @Test
    void testProvisionIcpdp_WithoutAuth_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/api/admin/users/icpdp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "Student")
    void testProvisionIcpdp_WithMemberRole_ShouldReturn403() throws Exception {
        mockMvc.perform(post("/api/admin/users/icpdp")
                .with(user(memberPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "Admin")
    void testProvisionIcpdp_WithAdminRole_ShouldReturn201Created() throws Exception {
        ProvisionIcpdpResponse mockResponse = ProvisionIcpdpResponse.builder()
                .action(ProvisionIcpdpAction.CREATED)
                .message("Created")
                .build();
        when(adminUserService.provisionIcpdp(any(CreateIcpdpRequest.class), eq(100))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/admin/users/icpdp")
                .with(user(adminPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.action").value("CREATED"));
    }

    @Test
    @WithMockUser(roles = "Admin")
    void testProvisionIcpdp_WithAdminRole_Upgraded_ShouldReturn200Ok() throws Exception {
        ProvisionIcpdpResponse mockResponse = ProvisionIcpdpResponse.builder()
                .action(ProvisionIcpdpAction.UPGRADED)
                .message("Upgraded")
                .build();
        when(adminUserService.provisionIcpdp(any(CreateIcpdpRequest.class), eq(100))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/admin/users/icpdp")
                .with(user(adminPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("UPGRADED"));
    }

    @Test
    @WithMockUser(roles = "Admin")
    void testProvisionIcpdp_InvalidEmail_ShouldReturn400() throws Exception {
        CreateIcpdpRequest invalidRequest = new CreateIcpdpRequest("invalid-email", "Test User");

        mockMvc.perform(post("/api/admin/users/icpdp")
                .with(user(adminPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "Admin")
    void testProvisionIcpdp_BlankFullName_ShouldReturn400() throws Exception {
        CreateIcpdpRequest invalidRequest = new CreateIcpdpRequest("test@gmail.com", "");

        mockMvc.perform(post("/api/admin/users/icpdp")
                .with(user(adminPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
