package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.AttendanceCorrectionRequest;
import com.fptu.fcms.dto.request.AttendanceSessionRequest;
import com.fptu.fcms.dto.response.AttendanceRegistrationSearchResponse;
import com.fptu.fcms.dto.response.AttendanceSessionResponse;
import com.fptu.fcms.dto.response.AttendanceSummaryResponse;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;

public interface AttendanceSessionService {
    AttendanceSessionResponse create(Integer eventId, AttendanceSessionRequest request, UserPrincipal currentUser);

    AttendanceSessionResponse update(Integer sessionId, AttendanceSessionRequest request, UserPrincipal currentUser);

    AttendanceSessionResponse getByEvent(Integer eventId, UserPrincipal currentUser);

    AttendanceSessionResponse open(Integer sessionId, UserPrincipal currentUser);

    AttendanceSessionResponse close(Integer sessionId, UserPrincipal currentUser);

    List<AttendanceRegistrationSearchResponse> searchRegistrations(Integer sessionId, String keyword, UserPrincipal currentUser);

    AttendanceRegistrationSearchResponse preview(Integer sessionId, Integer registrationId, UserPrincipal currentUser);

    AttendanceSummaryResponse summary(Integer eventId, UserPrincipal currentUser);

    AttendanceRegistrationSearchResponse correct(Integer recordId, AttendanceCorrectionRequest request, UserPrincipal currentUser);
}
