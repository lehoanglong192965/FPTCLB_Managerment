package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RegistrationListItemResponse {
    private Integer registrationID;
    private Integer eventID;
    private Integer userID;
    private String participantType;
    private String status;
    private LocalDateTime registeredAt;
    private String studentId;
    private String fullName;
    private String email;
    private String guestFullName;
    private String guestEmail;
    private String guestPhone;
}
