package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GuestRegistrationStatusResponse {
    private Integer eventId;
    private Integer registrationId;
    private String status;
    private String fullNameMasked;
    private String emailMasked;
    private String phoneMasked;
    private String registrationCode;
    private Integer waitlistPosition;
}