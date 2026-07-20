package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class MyRegistrationResponse {
    private Integer registrationId;
    private Integer eventId;
    private Integer clubId;
    private String eventName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;
    private String bannerUrl;
    private EventStatus eventStatus;
    private RegistrationStatus registrationStatus;
    private ParticipantType participantType;
    private String ticketCode;
    private LocalDateTime ticketIssuedAt;
    private boolean ticketEligible;
    private LocalDateTime registeredAt;
}
