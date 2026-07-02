package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttendanceRegistrationSearchResponse {
    private Integer registrationId;
    private String registrationCode;
    private String displayName;
    private String participantType;
    private String registrationStatus;
    private String attendanceStatus;
    private String emailMasked;
    private String phoneMasked;
    private String requiredVerificationMethod;
}