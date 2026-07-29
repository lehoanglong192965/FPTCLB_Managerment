package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.DisciplineLogDTO;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.DisciplineLog;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.TokenInvalidationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisciplineLogServiceImplTokenInvalidationTest {

    @Mock
    private DisciplineLogRepository disciplineLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private ClubMembershipRepository clubMembershipRepository;
    @Mock
    private ClubRoleRepository clubRoleRepository;
    @Mock
    private TokenInvalidationService tokenInvalidationService;

    @InjectMocks
    private DisciplineLogServiceImpl service;

    @Test
    void activeDisciplineDemotesLeaderSuspendsAccountAndInvalidatesTokens() {
        DisciplineLogDTO request = disciplineRequest("Active");
        ClubRole leaderRole = clubRole(1, "Leader");
        ClubRole memberRole = clubRole(3, "Member");
        ClubMembership membership = new ClubMembership();
        membership.setUserID(7);
        membership.setClubRoleID(1);
        UserAccount user = new UserAccount();
        user.setUserID(7);
        user.setAccountStatus("Active");

        when(userRepository.existsById(7)).thenReturn(true);
        when(semesterRepository.existsById(11)).thenReturn(true);
        when(disciplineLogRepository.save(any(DisciplineLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(clubRoleRepository.findByRoleNameAndIsDeletedFalse("Leader"))
                .thenReturn(Optional.of(leaderRole));
        when(clubRoleRepository.findByRoleNameAndIsDeletedFalse("Member"))
                .thenReturn(Optional.of(memberRole));
        when(clubMembershipRepository.findActiveLeaderMembershipsByUserAndSemester(7, 11, 1))
                .thenReturn(List.of(membership));
        when(userRepository.findById(7)).thenReturn(Optional.of(user));

        service.createDisciplineLog(request, 99);

        assertEquals(3, membership.getClubRoleID());
        assertEquals("Suspended", user.getAccountStatus());
        verify(clubMembershipRepository).save(membership);
        verify(userRepository).save(user);
        verify(tokenInvalidationService).invalidateFor(7);
    }

    @Test
    void nonActiveDisciplineDoesNotMutateAuthorizationOrInvalidateTokens() {
        DisciplineLogDTO request = disciplineRequest("Resolved");
        when(userRepository.existsById(7)).thenReturn(true);
        when(semesterRepository.existsById(11)).thenReturn(true);
        when(disciplineLogRepository.save(any(DisciplineLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.createDisciplineLog(request, 99);

        verify(tokenInvalidationService, never()).invalidateFor(any());
        verify(userRepository, never()).save(any(UserAccount.class));
        verify(clubMembershipRepository, never()).save(any(ClubMembership.class));
    }

    private DisciplineLogDTO disciplineRequest(String status) {
        DisciplineLogDTO request = new DisciplineLogDTO();
        request.setUserID(7);
        request.setSemesterID(11);
        request.setReason("Policy violation");
        request.setDisciplineStatus(status);
        return request;
    }

    private ClubRole clubRole(Integer id, String name) {
        ClubRole role = new ClubRole();
        role.setClubRoleID(id);
        role.setRoleName(name);
        return role;
    }
}