package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.ClubManagementSummaryDTO;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ClubManagementControllerSecurityTest {

    private static final String ENDPOINT = "/api/v1/clubs/management";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClubService clubService;

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get(ENDPOINT))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(clubService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Member", "Leader", "ViceLeader"})
    void nonManagementRolesAreForbidden(String roleName) throws Exception {
        mockMvc.perform(get(ENDPOINT).with(user(principal(roleName))))
                .andExpect(status().isForbidden());

        verifyNoInteractions(clubService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Admin", "ICPDP"})
    void adminAndIcpdpCanListAllNonDeletedClubs(String roleName) throws Exception {
        when(clubService.getAllClubsForManagement()).thenReturn(List.of(
                new ClubManagementSummaryDTO(1, "Alpha Club", "Active"),
                new ClubManagementSummaryDTO(2, "Beta Club", "Inactive")
        ));

        mockMvc.perform(get(ENDPOINT).with(user(principal(roleName))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].clubID").value(1))
                .andExpect(jsonPath("$[0].name").value("Alpha Club"))
                .andExpect(jsonPath("$[0].clubStatus").value("Active"))
                .andExpect(jsonPath("$[0].members").doesNotExist())
                .andExpect(jsonPath("$[1].clubID").value(2))
                .andExpect(jsonPath("$[1].name").value("Beta Club"))
                .andExpect(jsonPath("$[1].clubStatus").value("Inactive"));
    }

    private UserPrincipal principal(String roleName) {
        return new UserPrincipal(
                99,
                roleName.toLowerCase() + "@fpt.edu.vn",
                1,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
    }
}
