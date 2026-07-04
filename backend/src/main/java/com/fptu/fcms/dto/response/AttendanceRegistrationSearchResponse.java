package com.fptu.fcms.dto.response;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AttendanceRegistrationSearchResponse {
    private final Integer registrationId;
    private final Integer guestRegistrationId;
    private final Integer recordId;
    private final String registrationCode;
    private final String studentId;
    private final String displayName;
    private final String participantType;
    private final String registrationStatus;
    private final String attendanceStatus;
    private final LocalDateTime checkedInAt;
    private final LocalDateTime markedAt;
    private final String emailMasked;
    private final String phoneMasked;
    private final String requiredVerificationMethod;

    public AttendanceRegistrationSearchResponse(
            Integer registrationId,
            String registrationCode,
            String displayName,
            String participantType,
            String registrationStatus,
            String attendanceStatus,
            String emailMasked,
            String phoneMasked,
            String requiredVerificationMethod
    ) {
        this(registrationId, null, null, registrationCode, null, displayName, participantType, registrationStatus,
                attendanceStatus, null, null, emailMasked, phoneMasked, requiredVerificationMethod);
    }

    public AttendanceRegistrationSearchResponse(
            Integer registrationId,
            Integer guestRegistrationId,
            String registrationCode,
            String displayName,
            String participantType,
            String registrationStatus,
            String attendanceStatus,
            String emailMasked,
            String phoneMasked,
            String requiredVerificationMethod
    ) {
        this(registrationId, guestRegistrationId, null, registrationCode, null, displayName, participantType,
                registrationStatus, attendanceStatus, null, null, emailMasked, phoneMasked, requiredVerificationMethod);
    }

    public AttendanceRegistrationSearchResponse(
            Integer registrationId,
            Integer guestRegistrationId,
            Integer recordId,
            String registrationCode,
            String studentId,
            String displayName,
            String participantType,
            String registrationStatus,
            String attendanceStatus,
            LocalDateTime checkedInAt,
            LocalDateTime markedAt,
            String emailMasked,
            String phoneMasked,
            String requiredVerificationMethod
    ) {
        this.registrationId = registrationId;
        this.guestRegistrationId = guestRegistrationId;
        this.recordId = recordId;
        this.registrationCode = registrationCode;
        this.studentId = studentId;
        this.displayName = displayName;
        this.participantType = participantType;
        this.registrationStatus = registrationStatus;
        this.attendanceStatus = attendanceStatus;
        this.checkedInAt = checkedInAt;
        this.markedAt = markedAt;
        this.emailMasked = emailMasked;
        this.phoneMasked = phoneMasked;
        this.requiredVerificationMethod = requiredVerificationMethod;
    }
}