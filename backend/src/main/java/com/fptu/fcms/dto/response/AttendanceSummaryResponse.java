package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttendanceSummaryResponse {
    private Integer eventId;
    private long confirmedCount;
    private long presentCount;
    private long absentCount;
}