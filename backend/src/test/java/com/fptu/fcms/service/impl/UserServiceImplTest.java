package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.ClubRoleResponse;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClubMembershipRepository clubMembershipRepository;

    @Mock
    private SemesterRepository semesterRepository;

    @Mock
    private ClubRoleRepository clubRoleRepository;

    private UserServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserServiceImpl(
                userRepository,
                clubMembershipRepository,
                semesterRepository,
                clubRoleRepository
        );
    }

    @Test
    void getClubRole_whenSameManagementRoleInMultipleClubs_selectsLatestMembership() {
        Semester activeSemester = activeSemester();
        ClubMembership oldViceLeader = membership(10, 100, 2, LocalDate.of(2026, 6, 1));
        ClubMembership newViceLeader = membership(11, 200, 2, LocalDate.of(2026, 7, 1));

        when(semesterRepository.findByIsActiveTrueAndIsDeletedFalse()).thenReturn(Optional.of(activeSemester));
        when(clubMembershipRepository.findByUserIDAndSemesterIDAndIsDeletedFalse(7, 1))
                .thenReturn(List.of(oldViceLeader, newViceLeader));
        when(clubRoleRepository.findById(2)).thenReturn(Optional.of(role(2, "ViceLeader")));

        ClubRoleResponse response = service.getClubRole(7);

        assertEquals(2, response.getClubRoleID());
        assertEquals(200, response.getClubID());
        assertEquals("ViceLeader", response.getRoleName());
    }

    @Test
    void getClubRole_prefersManagementRoleOverNewerMemberRole() {
        Semester activeSemester = activeSemester();
        ClubMembership oldViceLeader = membership(10, 100, 2, LocalDate.of(2026, 6, 1));
        ClubMembership newMember = membership(11, 200, 3, LocalDate.of(2026, 7, 1));

        when(semesterRepository.findByIsActiveTrueAndIsDeletedFalse()).thenReturn(Optional.of(activeSemester));
        when(clubMembershipRepository.findByUserIDAndSemesterIDAndIsDeletedFalse(7, 1))
                .thenReturn(List.of(newMember, oldViceLeader));
        when(clubRoleRepository.findById(2)).thenReturn(Optional.of(role(2, "ViceLeader")));

        ClubRoleResponse response = service.getClubRole(7);

        assertEquals(2, response.getClubRoleID());
        assertEquals(100, response.getClubID());
        assertEquals("ViceLeader", response.getRoleName());
    }

    private Semester activeSemester() {
        Semester semester = new Semester();
        semester.setSemesterID(1);
        semester.setSemesterCode("SU26");
        semester.setIsActive(true);
        semester.setIsDeleted(false);
        return semester;
    }

    private ClubMembership membership(Integer membershipID, Integer clubID, Integer clubRoleID, LocalDate joinedDate) {
        ClubMembership membership = new ClubMembership();
        membership.setMembershipID(membershipID);
        membership.setClubID(clubID);
        membership.setUserID(7);
        membership.setSemesterID(1);
        membership.setClubRoleID(clubRoleID);
        membership.setJoinedDate(joinedDate);
        membership.setIsDeleted(false);
        return membership;
    }

    private ClubRole role(Integer clubRoleID, String roleName) {
        ClubRole role = new ClubRole();
        role.setClubRoleID(clubRoleID);
        role.setRoleName(roleName);
        role.setIsDeleted(false);
        return role;
    }
}
