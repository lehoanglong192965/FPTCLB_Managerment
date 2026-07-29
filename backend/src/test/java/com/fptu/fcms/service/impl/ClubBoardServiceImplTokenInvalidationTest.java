package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.ClubBoardChangeRequest;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.TokenInvalidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClubBoardServiceImplTokenInvalidationTest {

    @Mock
    private ClubMembershipRepository membershipRepo;
    @Mock
    private UserRepository userRepo;
    @Mock
    private SystemRoleRepository systemRoleRepo;
    @Mock
    private DisciplineLogRepository disciplineRepo;
    @Mock
    private SemesterRepository semesterRepo;
    @Mock
    private ClubRoleRepository clubRoleRepo;
    @Mock
    private AuditLogRepository auditRepo;
    @Mock
    private TokenInvalidationService tokenInvalidationService;

    @InjectMocks
    private ClubBoardServiceImpl service;

    private Semester activeSemester;
    private UserAccount targetUser;

    @BeforeEach
    void setUp() {
        activeSemester = new Semester();
        activeSemester.setSemesterID(11);
        activeSemester.setSemesterCode("SU26");

        targetUser = new UserAccount();
        targetUser.setUserID(7);
        targetUser.setRoleID(3);
        targetUser.setFullName("Target Student");
        targetUser.setAccountStatus("Active");
        targetUser.setIsDeleted(false);

        SystemRole studentRole = new SystemRole();
        studentRole.setRoleID(3);
        studentRole.setRoleName("Student");

        when(semesterRepo.findByIsActiveTrueAndIsDeletedFalse()).thenReturn(Optional.of(activeSemester));
        when(userRepo.findById(7)).thenReturn(Optional.of(targetUser));
        when(systemRoleRepo.findById(3)).thenReturn(Optional.of(studentRole));
        when(membershipRepo.save(any(ClubMembership.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void appointChangingExistingClubRoleInvalidatesExistingUserTokens() {
        ClubRole memberRole = clubRole(3, "Member");
        ClubMembership membership = membership(2);
        when(clubRoleRepo.findByRoleNameAndIsDeletedFalse("Member")).thenReturn(Optional.of(memberRole));
        when(membershipRepo.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(20, 7, 11))
                .thenReturn(Optional.of(membership));

        service.changeBoardMember(20, appointRequest("Member"), 99);

        verify(tokenInvalidationService).invalidateFor(7);
    }

    @Test
    void appointNewViceLeaderInvalidatesExistingUserTokens() {
        ClubRole viceLeaderRole = clubRole(2, "ViceLeader");
        when(clubRoleRepo.findByRoleNameAndIsDeletedFalse("ViceLeader"))
                .thenReturn(Optional.of(viceLeaderRole));
        when(membershipRepo.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(20, 7, 11))
                .thenReturn(Optional.empty());

        service.changeBoardMember(20, appointRequest("ViceLeader"), 99);

        verify(tokenInvalidationService).invalidateFor(7);
    }

    @Test
    void appointNewOrdinaryMemberDoesNotInvalidateUnchangedJwtClaims() {
        ClubRole memberRole = clubRole(3, "Member");
        when(clubRoleRepo.findByRoleNameAndIsDeletedFalse("Member")).thenReturn(Optional.of(memberRole));
        when(membershipRepo.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(20, 7, 11))
                .thenReturn(Optional.empty());

        service.changeBoardMember(20, appointRequest("Member"), 99);

        verify(tokenInvalidationService, never()).invalidateFor(any());
    }

    private ClubBoardChangeRequest appointRequest(String roleName) {
        ClubBoardChangeRequest request = new ClubBoardChangeRequest();
        request.setUserID(7);
        request.setAction("APPOINT");
        request.setNewRole(roleName);
        return request;
    }

    private ClubMembership membership(Integer roleID) {
        ClubMembership membership = new ClubMembership();
        membership.setMembershipID(31);
        membership.setClubID(20);
        membership.setUserID(7);
        membership.setSemesterID(11);
        membership.setClubRoleID(roleID);
        membership.setIsDeleted(false);
        return membership;
    }

    private ClubRole clubRole(Integer roleID, String roleName) {
        ClubRole role = new ClubRole();
        role.setClubRoleID(roleID);
        role.setRoleName(roleName);
        role.setIsDeleted(false);
        return role;
    }
}