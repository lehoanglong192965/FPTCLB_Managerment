package com.fptu.fcms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.FoundingMemberDTO;
import com.fptu.fcms.dto.response.ClubRegistrationResponseDTO;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubRegistrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClubRegistrationControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClubRegistrationService registrationService;

    private ClubRegistrationRequestDTO validRequest;

    @BeforeEach
    void setUp() {
        validRequest = buildValidRequest();
    }

    @Test
    void submitRegistration_allowsAdmin() throws Exception {
        when(registrationService.submitRegistration(any(), any())).thenReturn(approvedResponse());

        mockMvc.perform(post("/api/clubs/registrations")
                        .with(user(principal("Admin", 1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void submitRegistration_allowsIcpdp() throws Exception {
        when(registrationService.submitRegistration(any(), any())).thenReturn(approvedResponse());

        mockMvc.perform(post("/api/clubs/registrations")
                        .with(user(principal("ICPDP", 2)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void submitRegistration_rejectsStudent() throws Exception {
        mockMvc.perform(post("/api/clubs/registrations")
                        .with(user(principal("Student", 3)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isForbidden());

        verifyNoInteractions(registrationService);
    }

    private ClubRegistrationRequestDTO buildValidRequest() {
        ClubRegistrationRequestDTO request = new ClubRegistrationRequestDTO();
        request.setClubCode("AI");
        request.setClubName("AI Club");
        request.setClubNameEn("AI Club");
        request.setCategory("IT");
        request.setClubImage("/uploads/card-image/ai.png");
        request.setDescription("Artificial intelligence club");
        request.setMission("Build AI learning community");
        request.setUniqueness("Project-based AI learning");
        request.setOrgStructure("Leader, ViceLeader, Members");
        request.setMeetingFrequency("Weekly");
        request.setMeetingLocation("Room 101");
        request.setFinancialPlan("Member contributions and sponsorship");
        request.setFoundingMembers(List.of(
                founder("SE000001", "Leader"),
                founder("SE000002", "ViceLeader"),
                founder("SE000003", "Member"),
                founder("SE000004", "Member"),
                founder("SE000005", "Member")
        ));
        return request;
    }

    private FoundingMemberDTO founder(String studentId, String role) {
        FoundingMemberDTO founder = new FoundingMemberDTO();
        founder.setStudentId(studentId);
        founder.setProposedRole(role);
        founder.setFullName("Student " + studentId);
        founder.setEmail(studentId.toLowerCase() + "@fpt.edu.vn");
        founder.setPhoneNumber("0912345678");
        founder.setCohort("SE");
        founder.setClazz("SE1901");
        return founder;
    }

    private UserPrincipal principal(String role, Integer roleId) {
        return new UserPrincipal(
                99,
                role.toLowerCase() + "@fpt.edu.vn",
                roleId,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    private ClubRegistrationResponseDTO approvedResponse() {
        ClubRegistrationResponseDTO response = new ClubRegistrationResponseDTO();
        response.setRegistrationID(1);
        response.setClubCode("AI");
        response.setClubName("AI Club");
        response.setStatus("APPROVED");
        return response;
    }
}
