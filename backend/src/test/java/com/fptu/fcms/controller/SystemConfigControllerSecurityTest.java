package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.SystemConfigRequest;
import com.fptu.fcms.entity.SystemConfig;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.SystemConfigService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SystemConfigControllerSecurityTest {

    private static final String ENDPOINT = "/api/admin/system-configs";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemConfigService systemConfigService;

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get(ENDPOINT))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(systemConfigService);
    }

    @Test
    void nonAdminCannotReadOrUpdateRuntimeConfig() throws Exception {
        mockMvc.perform(get(ENDPOINT).with(user(principal("Student"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put(ENDPOINT + "/RAG_FALLBACK_MESSAGE")
                        .with(user(principal("ICPDP")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"configValue\":\"Fallback\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(systemConfigService);
    }

    @Test
    void adminCanReadAndUpdateRuntimeConfig() throws Exception {
        SystemConfig config = new SystemConfig();
        config.setConfigKey("RAG_FALLBACK_MESSAGE");
        config.setConfigValue("Fallback");
        when(systemConfigService.getAllConfigs()).thenReturn(List.of(config));
        when(systemConfigService.updateConfig(eq("RAG_FALLBACK_MESSAGE"), any(SystemConfigRequest.class)))
                .thenReturn(config);

        mockMvc.perform(get(ENDPOINT).with(user(principal("Admin"))))
                .andExpect(status().isOk());

        mockMvc.perform(put(ENDPOINT + "/RAG_FALLBACK_MESSAGE")
                        .with(user(principal("Admin")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"configValue\":\"Fallback\"}"))
                .andExpect(status().isOk());

        verify(systemConfigService).getAllConfigs();
        verify(systemConfigService).updateConfig(eq("RAG_FALLBACK_MESSAGE"), any(SystemConfigRequest.class));
    }

    private UserPrincipal principal(String roleName) {
        return new UserPrincipal(
                99,
                roleName.toLowerCase() + "@fpt.edu.vn",
                1,
                roleName,
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
    }
}
