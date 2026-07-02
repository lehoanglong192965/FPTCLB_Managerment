package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRoleRepository;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.event.EventPermissionService;
import com.fptu.fcms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class EventAssignmentAccessServiceImpl implements EventAssignmentAccessService {

    private static final String CHECK_IN_STAFF_ROLE = "CHECK_IN_STAFF";

    private final EventAssignmentRepository assignmentRepository;
    private final EventRoleRepository eventRoleRepository;
    private final EventPermissionService permissionService;

    @Override
    public void ensureCanManageCheckIn(Integer eventId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new BusinessRuleException("You are not authenticated.", HttpStatus.FORBIDDEN);
        }
        if (permissionService.canManageRegistrations(currentUser)) {
            return;
        }

        Integer checkInStaffRoleId = eventRoleRepository.findByRoleNameAndIsDeletedFalse(CHECK_IN_STAFF_ROLE)
                .map(role -> role.getEventRoleID())
                .orElseThrow(() -> new BusinessRuleException("CHECK_IN_STAFF role is not configured.", HttpStatus.FORBIDDEN));

        boolean assigned = assignmentRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, currentUser.getUserId())
                .map(EventAssignment::getEventRoleID)
                .map(checkInStaffRoleId::equals)
                .orElse(false);
        if (!assigned) {
            throw new BusinessRuleException("You are not assigned to manage this event check-in.", HttpStatus.FORBIDDEN);
        }
    }
}
