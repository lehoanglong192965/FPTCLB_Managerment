package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.AttendanceCheckInResponse;

public interface AttendanceService {
    AttendanceCheckInResponse checkIn(String qrToken);
}
