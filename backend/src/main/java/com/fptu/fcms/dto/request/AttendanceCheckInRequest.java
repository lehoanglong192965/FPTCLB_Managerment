package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceCheckInRequest {

    @NotNull(message = "registrationId is required")
    private Integer registrationId;

    @NotBlank(message = "verificationMethod is required")
    private String verificationMethod;

    private String verificationValue;

    private String guestFullName;

    private String note;
}