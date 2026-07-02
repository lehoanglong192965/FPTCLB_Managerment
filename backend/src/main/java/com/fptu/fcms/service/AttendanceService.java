package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.AttendanceCheckInRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;

public interface AttendanceService {
    AttendanceCheckInResponse checkIn(Integer sessionId, AttendanceCheckInRequest request, Integer actorId);
}
