package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.security.UserPrincipal;
import java.util.Map;

public interface ReportUploadService {
    Map<String, String> uploadEventReport(CreateEventReportRequest request, UserPrincipal currentUser);
    EventReport getReportByEventId(Integer eventId, UserPrincipal currentUser);
}
