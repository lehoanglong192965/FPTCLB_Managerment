package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.dto.response.EventReportStatisticsResponse;
import com.fptu.fcms.security.UserPrincipal;
import java.util.Map;
import java.util.Optional;

public interface ReportUploadService {
    Map<String, String> uploadEventReport(CreateEventReportRequest request, UserPrincipal currentUser);
    Optional<EventReport> getReportByEventId(Integer eventId, UserPrincipal currentUser);
    EventReportStatisticsResponse getStatistics(Integer eventId, UserPrincipal currentUser);
}
