package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttendanceCheckInResponse {
    private Integer eventId;
    private Integer userId;
    private String status;
    private String message;
}
