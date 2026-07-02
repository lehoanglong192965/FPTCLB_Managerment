package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AttendanceSessionResponse {
    private Integer sessionId;
    private Integer eventId;
    private String name;
    private String status;
    private LocalDateTime opensAt;
    private LocalDateTime closesAt;
}