package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.AttendanceCorrectionRequest;
import com.fptu.fcms.dto.request.AttendanceSessionRequest;
import com.fptu.fcms.dto.response.AttendanceRegistrationSearchResponse;
import com.fptu.fcms.dto.response.AttendanceSessionResponse;
import com.fptu.fcms.dto.response.AttendanceSummaryResponse;

import java.util.List;

public interface AttendanceSessionService {
    AttendanceSessionResponse create(Integer eventId, AttendanceSessionRequest request, Integer actorId);

    AttendanceSessionResponse update(Integer sessionId, AttendanceSessionRequest request);

    AttendanceSessionResponse getByEvent(Integer eventId);

    AttendanceSessionResponse open(Integer sessionId, Integer actorId);

    AttendanceSessionResponse close(Integer sessionId, Integer actorId);

    List<AttendanceRegistrationSearchResponse> searchRegistrations(Integer sessionId, String keyword);

    AttendanceRegistrationSearchResponse preview(Integer sessionId, Integer registrationId);

    AttendanceSummaryResponse summary(Integer eventId);

    AttendanceRegistrationSearchResponse correct(Integer recordId, AttendanceCorrectionRequest request, Integer actorId);
}