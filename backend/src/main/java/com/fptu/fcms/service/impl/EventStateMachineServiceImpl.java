package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.service.event.EventStateMachineService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EventStateMachineServiceImpl implements EventStateMachineService {

    @Override
    public void ensureCanOpenRegistration(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.APPROVED)) {
            throw invalidState("Event must be Approved before opening registration.");
        }
    }

    @Override
    public void ensureCanCloseRegistration(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.REGISTRATION_OPEN)) {
            throw invalidState("Event must be RegistrationOpen to close registration.");
        }
    }

    @Override
    public void ensureCanApprove(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.PENDING, EventStatus.PENDING_APPROVAL)) {
            throw invalidState("Event must be Pending or PendingApproval before approval.");
        }
    }

    @Override
    public void ensureCanReject(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.PENDING, EventStatus.PENDING_APPROVAL)) {
            throw invalidState("Event must be Pending or PendingApproval before rejection.");
        }
    }

    @Override
    public void ensureCanStart(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.REGISTRATION_CLOSED)) {
            throw invalidState("Event must be RegistrationClosed before starting.");
        }
    }

    @Override
    public void ensureCanFinish(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.ONGOING)) {
            throw invalidState("Event must be Ongoing before finishing.");
        }
    }

    @Override
    public void ensureCanClose(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.COMPLETED, EventStatus.REPORT_UPLOADED)) {
            throw invalidState("Event must be Completed or ReportUploaded before closing.");
        }
    }

    @Override
    public void ensureRegistrationWindowOpen(Event event) {
        if (event == null || !isAnyStatus(event.getEventStatus(), EventStatus.REGISTRATION_OPEN)) {
            throw invalidState("Su kien hien khong mo dang ky.");
        }
    }

    @Override
    public void ensureWalkInWindowOpen(Event event) {
        if (event == null || (!isAnyStatus(event.getEventStatus(), EventStatus.REGISTRATION_OPEN, EventStatus.ONGOING))) {
            throw invalidState("Walk-in registrations are only allowed during registration or ongoing events.");
        }
    }

    private boolean isAnyStatus(String currentStatus, EventStatus... allowed) {
        if (!StringUtils.hasText(currentStatus)) {
            return false;
        }
        EventStatus current = EventStatus.fromValue(currentStatus);
        if (current == null) {
            return false;
        }
        for (EventStatus allowedStatus : allowed) {
            if (current == allowedStatus) {
                return true;
            }
        }
        return false;
    }

    private BusinessRuleException invalidState(String message) {
        return new BusinessRuleException(ApiErrorCode.EVENT_STATE_INVALID.name(), message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
