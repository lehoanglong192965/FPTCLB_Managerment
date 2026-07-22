package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.EventRoleRepository;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.event.EventPermissionService;
import com.fptu.fcms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventAssignmentAccessServiceImpl implements EventAssignmentAccessService {

    private static final String CHECK_IN_STAFF_ROLE = "CHECK_IN_STAFF";
    private static final Set<String> CLUB_BOARD_ROLE_NAMES = Set.of("Leader", "ViceLeader");

    private final EventAssignmentRepository assignmentRepository;
    private final EventRoleRepository eventRoleRepository;
    private final EventRepository eventRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final EventPermissionService permissionService;

    @Override
    public void ensureCanManageEvent(Integer eventId, UserPrincipal currentUser) {
        requireAuthenticated(currentUser);
        Event event = requireActiveEvent(eventId);
        if (!hasManagementAccess(event, currentUser)) {
            throw forbidden("You are not authorized to manage this event.");
        }
    }

    @Override
    public void ensureCanManageCheckIn(Integer eventId, UserPrincipal currentUser) {
        requireAuthenticated(currentUser);
        Event event = requireActiveEvent(eventId);
        if (hasManagementAccess(event, currentUser) || isAssignedCheckInStaff(eventId, currentUser.getUserId())) {
            return;
        }

        throw forbidden("You are not authorized to manage this event check-in.");
    }

    @Override
    public boolean canViewGuestContact(Integer eventId, UserPrincipal currentUser) {
        requireAuthenticated(currentUser);
        Event event = requireActiveEvent(eventId);
        return !permissionService.isIcpdp(currentUser)
                && event.getClubID() != null
                && event.getSemesterID() != null
                && permissionService.isLeader(currentUser)
                && clubMembershipRepository.existsActiveMembershipByClubUserSemesterAndRoleNames(
                        event.getClubID(),
                        currentUser.getUserId(),
                        event.getSemesterID(),
                        CLUB_BOARD_ROLE_NAMES
                );
    }

    private Event requireActiveEvent(Integer eventId) {
        if (eventId == null) {
            throw new BusinessRuleException(ApiErrorCode.NOT_FOUND.name(), "Event not found.", HttpStatus.NOT_FOUND);
        }
        return eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new BusinessRuleException(
                        ApiErrorCode.NOT_FOUND.name(),
                        "Event not found.",
                        HttpStatus.NOT_FOUND
                ));
    }

    private void requireAuthenticated(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException(
                    ApiErrorCode.UNAUTHORIZED.name(),
                    "You are not authenticated.",
                    HttpStatus.UNAUTHORIZED
            );
        }
    }

    private boolean hasManagementAccess(Event event, UserPrincipal currentUser) {
        if (permissionService.isIcpdp(currentUser)) {
            return true;
        }
        return event.getClubID() != null
                && event.getSemesterID() != null
                && permissionService.isLeader(currentUser)
                && clubMembershipRepository.existsActiveMembershipByClubUserSemesterAndRoleNames(
                        event.getClubID(),
                        currentUser.getUserId(),
                        event.getSemesterID(),
                        CLUB_BOARD_ROLE_NAMES
                );
    }

    private boolean isAssignedCheckInStaff(Integer eventId, Integer userId) {
        return eventRoleRepository.findByRoleNameAndIsDeletedFalse(CHECK_IN_STAFF_ROLE)
                .map(role -> role.getEventRoleID())
                .flatMap(checkInStaffRoleId -> assignmentRepository
                        .findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                        .map(EventAssignment::getEventRoleID)
                        .filter(checkInStaffRoleId::equals))
                .isPresent();
    }

    private BusinessRuleException forbidden(String message) {
        return new BusinessRuleException(ApiErrorCode.FORBIDDEN.name(), message, HttpStatus.FORBIDDEN);
    }
}
