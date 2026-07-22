package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.AttendanceCheckInRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.security.UserPrincipal;

public interface AttendanceService {
    AttendanceCheckInResponse checkIn(Integer sessionId, AttendanceCheckInRequest request, Integer actorId);

    AttendanceCheckInResponse checkIn(Integer sessionId, AttendanceCheckInRequest request, UserPrincipal currentUser);
}
