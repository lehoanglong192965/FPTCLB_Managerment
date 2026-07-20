package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRole;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.EventRoleRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.event.EventPermissionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventAssignmentAccessServiceImplTest {

    private static final String CHECK_IN_STAFF_ROLE = "CHECK_IN_STAFF";

    @Mock
    private EventAssignmentRepository assignmentRepository;
    @Mock
    private EventRoleRepository eventRoleRepository;
    @Mock
    private EventPermissionService permissionService;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private ClubMembershipRepository clubMembershipRepository;

    @InjectMocks
    private EventAssignmentAccessServiceImpl service;

    @Test
    void boardMemberOfHostClubCanManageEvent() {
        Event event = event(100, 77);
        UserPrincipal principal = principal(17, "Leader");
        when(eventRepository.findByEventIDAndIsDeletedFalse(100)).thenReturn(Optional.of(event));
        when(permissionService.isIcpdp(principal)).thenReturn(false);
        when(permissionService.isLeader(principal)).thenReturn(true);
        when(clubMembershipRepository.existsActiveMembershipByClubUserSemesterAndRoleNames(
                77,
                17,
                2026,
                Set.of("Leader", "ViceLeader")
        )).thenReturn(true);

        assertDoesNotThrow(() -> service.ensureCanManageEvent(100, principal));
    }

    @Test
    void leaderFromAnotherClubIsForbiddenFromManagingEvent() {
        Event event = event(100, 77);
        UserPrincipal principal = principal(18, "Leader");
        when(eventRepository.findByEventIDAndIsDeletedFalse(100)).thenReturn(Optional.of(event));
        when(permissionService.isIcpdp(principal)).thenReturn(false);
        when(permissionService.isLeader(principal)).thenReturn(true);
        when(clubMembershipRepository.existsActiveMembershipByClubUserSemesterAndRoleNames(
                77,
                18,
                2026,
                Set.of("Leader", "ViceLeader")
        )).thenReturn(false);

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.ensureCanManageEvent(100, principal)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals(ApiErrorCode.FORBIDDEN.name(), error.getErrorCode());
        verify(clubMembershipRepository).existsActiveMembershipByClubUserSemesterAndRoleNames(
                77,
                18,
                2026,
                Set.of("Leader", "ViceLeader")
        );
    }

    @Test
    void onlyHostClubBoardCanViewGuestContact() {
        Event event = event(100, 77);
        UserPrincipal principal = principal(17, "Leader");
        when(eventRepository.findByEventIDAndIsDeletedFalse(100)).thenReturn(Optional.of(event));
        when(permissionService.isIcpdp(principal)).thenReturn(false);
        when(permissionService.isLeader(principal)).thenReturn(true);
        when(clubMembershipRepository.existsActiveMembershipByClubUserSemesterAndRoleNames(
                77,
                17,
                2026,
                Set.of("Leader", "ViceLeader")
        )).thenReturn(true);

        assertEquals(true, service.canViewGuestContact(100, principal));
    }

    @Test
    void icpdpCannotViewGuestContactEvenWhenManagingTheEvent() {
        Event event = event(100, 77);
        UserPrincipal principal = principal(19, "ICPDP");
        when(eventRepository.findByEventIDAndIsDeletedFalse(100)).thenReturn(Optional.of(event));
        when(permissionService.isIcpdp(principal)).thenReturn(true);

        assertEquals(false, service.canViewGuestContact(100, principal));
        verifyNoInteractions(clubMembershipRepository);
    }

    @Test
    void icpdpCanManageAnyEvent() {
        Event event = event(100, 77);
        UserPrincipal principal = principal(19, "ICPDP");
        when(eventRepository.findByEventIDAndIsDeletedFalse(100)).thenReturn(Optional.of(event));
        when(permissionService.isIcpdp(principal)).thenReturn(true);

        assertDoesNotThrow(() -> service.ensureCanManageEvent(100, principal));

        verifyNoInteractions(clubMembershipRepository, eventRoleRepository, assignmentRepository);
    }

    @Test
    void assignedCheckInStaffCanManageOnlyCheckIn() {
        Event event = event(100, 77);
        UserPrincipal principal = principal(20, "Student");
        EventRole checkInStaffRole = eventRole(6, CHECK_IN_STAFF_ROLE);
        EventAssignment assignment = assignment(100, 20, 6);
        when(eventRepository.findByEventIDAndIsDeletedFalse(100)).thenReturn(Optional.of(event));
        when(permissionService.isIcpdp(principal)).thenReturn(false);
        when(permissionService.isLeader(principal)).thenReturn(false);
        when(eventRoleRepository.findByRoleNameAndIsDeletedFalse(CHECK_IN_STAFF_ROLE))
                .thenReturn(Optional.of(checkInStaffRole));
        when(assignmentRepository.findByEventIDAndUserIDAndIsDeletedFalse(100, 20))
                .thenReturn(Optional.of(assignment));

        assertDoesNotThrow(() -> service.ensureCanManageCheckIn(100, principal));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.ensureCanManageEvent(100, principal)
        );
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
    }

    @Test
    void userWithoutCheckInAssignmentIsForbiddenFromCheckIn() {
        Event event = event(100, 77);
        UserPrincipal principal = principal(21, "Student");
        EventRole checkInStaffRole = eventRole(6, CHECK_IN_STAFF_ROLE);
        when(eventRepository.findByEventIDAndIsDeletedFalse(100)).thenReturn(Optional.of(event));
        when(permissionService.isIcpdp(principal)).thenReturn(false);
        when(permissionService.isLeader(principal)).thenReturn(false);
        when(eventRoleRepository.findByRoleNameAndIsDeletedFalse(CHECK_IN_STAFF_ROLE))
                .thenReturn(Optional.of(checkInStaffRole));
        when(assignmentRepository.findByEventIDAndUserIDAndIsDeletedFalse(100, 21))
                .thenReturn(Optional.empty());

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.ensureCanManageCheckIn(100, principal)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals(ApiErrorCode.FORBIDDEN.name(), error.getErrorCode());
    }

    @Test
    void unauthenticatedUserIsUnauthorizedBeforeEventLookup() {
        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.ensureCanManageEvent(100, null)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        assertEquals(ApiErrorCode.UNAUTHORIZED.name(), error.getErrorCode());
        verifyNoInteractions(eventRepository, permissionService, clubMembershipRepository, eventRoleRepository, assignmentRepository);
    }

    private Event event(Integer eventId, Integer clubId) {
        Event event = new Event();
        event.setEventID(eventId);
        event.setClubID(clubId);
        event.setSemesterID(2026);
        return event;
    }

    private EventRole eventRole(Integer eventRoleId, String roleName) {
        EventRole eventRole = new EventRole();
        eventRole.setEventRoleID(eventRoleId);
        eventRole.setRoleName(roleName);
        return eventRole;
    }

    private EventAssignment assignment(Integer eventId, Integer userId, Integer eventRoleId) {
        EventAssignment assignment = new EventAssignment();
        assignment.setEventID(eventId);
        assignment.setUserID(userId);
        assignment.setEventRoleID(eventRoleId);
        return assignment;
    }

    private UserPrincipal principal(Integer userId, String role) {
        return new UserPrincipal(
                userId,
                role.toLowerCase() + "@fpt.edu.vn",
                3,
                "Student",
                role,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
