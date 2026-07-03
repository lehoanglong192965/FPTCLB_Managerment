package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceCheckInRequest {

    private Integer registrationId;

    private Integer guestRegistrationId;

    @NotBlank(message = "verificationMethod is required")
    private String verificationMethod;

    private String verificationValue;

    private String guestFullName;

    private String note;
}
