package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttendanceCheckInResponse {
    private Integer eventId;
    private Integer registrationId;
    private Integer userId;
    private AttendanceStatus status;
    private String message;
}