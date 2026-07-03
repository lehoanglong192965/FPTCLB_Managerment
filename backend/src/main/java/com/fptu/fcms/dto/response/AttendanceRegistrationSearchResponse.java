package com.fptu.fcms.dto.response;

import lombok.Getter;

@Getter
public class AttendanceRegistrationSearchResponse {
    private final Integer registrationId;
    private final Integer guestRegistrationId;
    private final String registrationCode;
    private final String displayName;
    private final String participantType;
    private final String registrationStatus;
    private final String attendanceStatus;
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
        this(registrationId, null, registrationCode, displayName, participantType, registrationStatus, attendanceStatus, emailMasked, phoneMasked, requiredVerificationMethod);
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
        this.registrationId = registrationId;
        this.guestRegistrationId = guestRegistrationId;
        this.registrationCode = registrationCode;
        this.displayName = displayName;
        this.participantType = participantType;
        this.registrationStatus = registrationStatus;
        this.attendanceStatus = attendanceStatus;
        this.emailMasked = emailMasked;
        this.phoneMasked = phoneMasked;
        this.requiredVerificationMethod = requiredVerificationMethod;
    }
}