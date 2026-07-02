package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WalkInGuestEmergencyOverrideRequest extends GuestRegistrationRequest {
    @NotBlank
    private String reason;

    private String note;
}