package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
public class AttendanceCheckInResponse {
    private final Integer eventId;
    private final Integer registrationId;
    private final Integer userId;
    private final String fullName;
    private final String studentId;
    private final String participantType;
    private final AttendanceStatus status;
    private final String message;

    /** Ticket order the scanned ticket belongs to; only set when one scan covered several tickets. */
    private final String ticketOrderCode;

    /** Per-person outcome of a group ticket scan; null for a plain single check-in. */
    private final List<GroupMemberResult> groupMembers;

    public AttendanceCheckInResponse(
            Integer eventId,
            Integer registrationId,
            Integer userId,
            String fullName,
            String studentId,
            String participantType,
            AttendanceStatus status,
            String message
    ) {
        this(eventId, registrationId, userId, fullName, studentId, participantType, status, message, null, null);
    }

    public AttendanceCheckInResponse(
            Integer eventId,
            Integer registrationId,
            Integer userId,
            String fullName,
            String studentId,
            String participantType,
            AttendanceStatus status,
            String message,
            String ticketOrderCode,
            List<GroupMemberResult> groupMembers
    ) {
        this.eventId = eventId;
        this.registrationId = registrationId;
        this.userId = userId;
        this.fullName = fullName;
        this.studentId = studentId;
        this.participantType = participantType;
        this.status = status;
        this.message = message;
        this.ticketOrderCode = ticketOrderCode;
        this.groupMembers = groupMembers;
    }

    @Getter
    @AllArgsConstructor
    public static class GroupMemberResult {
        private Integer registrationId;
        private Integer userId;
        private String fullName;
        private String studentId;
        /** CHECKED_IN, ALREADY_PRESENT or SKIPPED. */
        private String outcome;
        private String reason;
    }
}
