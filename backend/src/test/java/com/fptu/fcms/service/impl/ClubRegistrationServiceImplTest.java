package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.FoundingMemberDTO;
import com.fptu.fcms.dto.request.ReviewRegistrationRequestDTO;
import com.fptu.fcms.dto.response.ClubRegistrationResponseDTO;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRegistration;
import com.fptu.fcms.entity.ClubRegistrationMember;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRegistrationRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ClubRegistrationServiceImplTest {

    @Mock
    private ClubRegistrationRepository registrationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClubRepository clubRepository;

    @Mock
    private ClubMembershipRepository clubMembershipRepository;

    @Mock
    private ClubRoleRepository clubRoleRepository;

    @Mock
    private SemesterRepository semesterRepository;

    @Mock
    private SystemRoleRepository systemRoleRepository;

    @Mock
    private DisciplineLogRepository disciplineLogRepository;

    private ClubRegistrationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ClubRegistrationServiceImpl(
                registrationRepository,
                userRepository,
                clubRepository,
                clubMembershipRepository,
                clubRoleRepository,
                semesterRepository,
                systemRoleRepository,
                disciplineLogRepository
        );
        mockActiveSemester();
        mockClubRoles();
        when(registrationRepository.save(any(ClubRegistration.class))).thenAnswer(invocation -> {
            ClubRegistration registration = invocation.getArgument(0);
            registration.setRegistrationID(100);
            return registration;
        });
        when(clubRepository.save(any(Club.class))).thenAnswer(invocation -> {
            Club club = invocation.getArgument(0);
            club.setClubID(200);
            return club;
        });
    }

    @Test
    void submitRegistration_createsApprovedRegistrationActiveClubAndMemberships() {
        ClubRegistrationRequestDTO request = validRequest();
        mockStudentRole();
        mockFounderUsers(request, 3);

        ClubRegistrationResponseDTO response = service.submitRegistration(request, 99);

        assertEquals("APPROVED", response.getStatus());
        ArgumentCaptor<ClubRegistration> registrationCaptor = ArgumentCaptor.forClass(ClubRegistration.class);
        verify(registrationRepository).save(registrationCaptor.capture());
        assertEquals("APPROVED", registrationCaptor.getValue().getStatus());

        ArgumentCaptor<Club> clubCaptor = ArgumentCaptor.forClass(Club.class);
        verify(clubRepository).save(clubCaptor.capture());
        assertEquals("Active", clubCaptor.getValue().getClubStatus());
        assertEquals("FCODE", clubCaptor.getValue().getClubCode());

        verify(clubMembershipRepository, times(5)).save(any(ClubMembership.class));
    }

    @Test
    void submitRegistration_rejectsFewerThanFiveFounders() {
        ClubRegistrationRequestDTO request = requestWithMembers(List.of(
                member("Leader", "SE170001"),
                member("ViceLeader", "SE170002"),
                member("Member", "SE170003"),
                member("Member", "SE170004")
        ));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("at least 5"));
        verify(clubRepository, never()).save(any(Club.class));
        verify(clubMembershipRepository, never()).save(any(ClubMembership.class));
    }

    @Test
    void submitRegistration_rejectsMissingLeader() {
        ClubRegistrationRequestDTO request = requestWithMembers(List.of(
                member("ViceLeader", "SE170002"),
                member("Member", "SE170003"),
                member("Member", "SE170004"),
                member("Member", "SE170005"),
                member("Member", "SE170006")
        ));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("exactly 1 Leader"));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void submitRegistration_rejectsMissingViceLeader() {
        ClubRegistrationRequestDTO request = requestWithMembers(List.of(
                member("Leader", "SE170001"),
                member("Member", "SE170003"),
                member("Member", "SE170004"),
                member("Member", "SE170005"),
                member("Member", "SE170006")
        ));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("exactly 1 ViceLeader"));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void submitRegistration_rejectsInvalidRole() {
        ClubRegistrationRequestDTO request = requestWithMembers(List.of(
                member("Leader", "SE170001"),
                member("ViceLeader", "SE170002"),
                member("Member", "SE170003"),
                member("Member", "SE170004"),
                member("CoreTeam", "SE170005")
        ));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("Leader, ViceLeader, or Member"));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void submitRegistration_rejectsDuplicateFounderStudentId() {
        ClubRegistrationRequestDTO request = requestWithMembers(List.of(
                member("Leader", "SE170001"),
                member("ViceLeader", "SE170002"),
                member("Member", "SE170003"),
                member("Member", "SE170003"),
                member("Member", "SE170005")
        ));
        mockStudentRole();
        mockFounderUsers(request, 3);

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("Duplicate"));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void submitRegistration_rejectsExistingActiveClubCode() {
        ClubRegistrationRequestDTO request = validRequest();
        when(clubRepository.existsByClubCodeAndIsDeletedFalse("FCODE")).thenReturn(true);

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("Club code already exists"));
        verify(registrationRepository, never()).save(any(ClubRegistration.class));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void submitRegistration_doesNotCheckPendingRegistrationsForCodeNameConflicts() {
        ClubRegistrationRequestDTO request = validRequest();
        mockStudentRole();
        mockFounderUsers(request, 3);

        ClubRegistrationResponseDTO response = service.submitRegistration(request, 99);

        assertEquals("APPROVED", response.getStatus());
        verify(registrationRepository, never()).findByStatusAndIsDeletedFalse("PENDING");
        verify(clubRepository).save(any(Club.class));
    }

    @Test
    void submitRegistration_rejectsStaffFounder() {
        ClubRegistrationRequestDTO request = validRequest();
        mockStudentRole();
        when(userRepository.findByStudentIdAndIsDeletedFalse("SE170001"))
                .thenReturn(Optional.of(user(1, 1, "SE170001")));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("student accounts"));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void submitRegistration_rejectsLeaderWithActiveDiscipline() {
        ClubRegistrationRequestDTO request = validRequest();
        mockStudentRole();
        when(userRepository.findByStudentIdAndIsDeletedFalse("SE170001"))
                .thenReturn(Optional.of(user(1, 3, "SE170001")));
        when(disciplineLogRepository.hasActiveDiscipline(1, 1, "Active")).thenReturn(true);

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("active discipline"));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void submitRegistration_rejectsLeaderAlreadyLeadingAnotherClub() {
        ClubRegistrationRequestDTO request = validRequest();
        mockStudentRole();
        when(userRepository.findByStudentIdAndIsDeletedFalse("SE170001"))
                .thenReturn(Optional.of(user(1, 3, "SE170001")));
        when(disciplineLogRepository.hasActiveDiscipline(1, 1, "Active")).thenReturn(false);
        when(clubMembershipRepository.existsByUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(1, 1, 1))
                .thenReturn(true);

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.submitRegistration(request, 99)
        );

        assertTrue(exception.getMessage().contains("already leads"));
        verify(clubRepository, never()).save(any(Club.class));
    }

    @Test
    void reviewRegistration_revalidatesLegacyPendingBeforeApproval() {
        ClubRegistration legacyRegistration = registrationWithMembers(List.of(
                registrationMember("Leader", "SE170001"),
                registrationMember("ViceLeader", "SE170002"),
                registrationMember("Member", "SE170003"),
                registrationMember("Member", "SE170004")
        ));
        when(registrationRepository.findById(100)).thenReturn(Optional.of(legacyRegistration));

        ReviewRegistrationRequestDTO request = new ReviewRegistrationRequestDTO();
        request.setStatus("APPROVED");

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.reviewRegistration(100, request, 99)
        );

        assertTrue(exception.getMessage().contains("at least 5"));
        verify(clubRepository, never()).save(any(Club.class));
        verify(clubMembershipRepository, never()).save(any(ClubMembership.class));
    }

    private void mockActiveSemester() {
        Semester semester = new Semester();
        semester.setSemesterID(1);
        semester.setIsActive(true);
        semester.setIsDeleted(false);
        when(semesterRepository.findByIsActiveTrueAndIsDeletedFalse()).thenReturn(Optional.of(semester));
    }

    private void mockClubRoles() {
        when(clubRoleRepository.findByRoleNameAndIsDeletedFalse("Leader"))
                .thenReturn(Optional.of(clubRole(1, "Leader")));
        when(clubRoleRepository.findByRoleNameAndIsDeletedFalse("ViceLeader"))
                .thenReturn(Optional.of(clubRole(2, "ViceLeader")));
        when(clubRoleRepository.findByRoleNameAndIsDeletedFalse("Member"))
                .thenReturn(Optional.of(clubRole(3, "Member")));
    }

    private void mockStudentRole() {
        SystemRole studentRole = new SystemRole();
        studentRole.setRoleID(3);
        studentRole.setRoleName("Student");
        studentRole.setIsDeleted(false);
        when(systemRoleRepository.findByRoleName("Student")).thenReturn(Optional.of(studentRole));
    }

    private void mockFounderUsers(ClubRegistrationRequestDTO request, Integer roleId) {
        int userId = 1;
        for (FoundingMemberDTO member : request.getFoundingMembers()) {
            when(userRepository.findByStudentIdAndIsDeletedFalse(member.getStudentId()))
                    .thenReturn(Optional.of(user(userId++, roleId, member.getStudentId())));
        }
    }

    private ClubRegistrationRequestDTO validRequest() {
        return requestWithMembers(List.of(
                member("Leader", "SE170001"),
                member("ViceLeader", "SE170002"),
                member("Member", "SE170003"),
                member("Member", "SE170004"),
                member("Member", "SE170005")
        ));
    }

    private ClubRegistrationRequestDTO requestWithMembers(List<FoundingMemberDTO> members) {
        ClubRegistrationRequestDTO request = new ClubRegistrationRequestDTO();
        request.setClubCode("FCODE");
        request.setClubName("F-Code Club");
        request.setCategory("IT");
        request.setClubImage("/uploads/fcode.png");
        request.setDescription("Programming club");
        request.setMission("Build programming community");
        request.setUniqueness("Focused on competitive programming");
        request.setOrgStructure("Leader, ViceLeader, Members");
        request.setMeetingFrequency("1 lan / tuan");
        request.setMeetingLocation("Campus");
        request.setFinancialPlan("Member fund");
        request.setFoundingMembers(members);
        return request;
    }

    private FoundingMemberDTO member(String role, String studentId) {
        FoundingMemberDTO member = new FoundingMemberDTO();
        member.setProposedRole(role);
        member.setStudentId(studentId);
        member.setFullName("Student " + studentId);
        member.setEmail(studentId.toLowerCase() + "@fpt.edu.vn");
        member.setPhoneNumber("0912345678");
        return member;
    }

    private ClubRegistration registrationWithMembers(List<ClubRegistrationMember> members) {
        ClubRegistration registration = new ClubRegistration();
        registration.setRegistrationID(100);
        registration.setClubCode("LEGACY");
        registration.setClubName("Legacy Club");
        registration.setCategory("IT");
        registration.setClubImage("/uploads/legacy.png");
        registration.setDescription("Legacy pending registration");
        registration.setMission("Mission");
        registration.setUniqueness("Unique");
        registration.setOrgStructure("Structure");
        registration.setMeetingFrequency("Weekly");
        registration.setMeetingLocation("Campus");
        registration.setFinancialPlan("Fund");
        registration.setStatus("PENDING");
        registration.setCreatedBy(10);
        registration.setIsDeleted(false);
        members.forEach(member -> member.setRegistration(registration));
        registration.setFoundingMembers(members);
        return registration;
    }

    private ClubRegistrationMember registrationMember(String role, String studentId) {
        ClubRegistrationMember member = new ClubRegistrationMember();
        member.setStudentId(studentId);
        member.setProposedRole(role);
        member.setFullName("Student " + studentId);
        member.setEmail(studentId.toLowerCase() + "@fpt.edu.vn");
        member.setPhoneNumber("0912345678");
        member.setIsDeleted(false);
        return member;
    }

    private ClubRole clubRole(Integer roleId, String roleName) {
        ClubRole role = new ClubRole();
        role.setClubRoleID(roleId);
        role.setRoleName(roleName);
        role.setIsDeleted(false);
        return role;
    }

    private UserAccount user(Integer userId, Integer roleId, String studentId) {
        UserAccount user = new UserAccount();
        user.setUserID(userId);
        user.setRoleID(roleId);
        user.setStudentId(studentId);
        user.setFullName("Student " + studentId);
        user.setEmail(studentId.toLowerCase() + "@fpt.edu.vn");
        user.setIsDeleted(false);
        return user;
    }
}
