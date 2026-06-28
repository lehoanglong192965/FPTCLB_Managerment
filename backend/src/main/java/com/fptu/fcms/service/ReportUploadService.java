package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.entity.EventReport;
import java.util.Map;

public interface ReportUploadService {
    Map<String, String> uploadEventReport(CreateEventReportRequest request, Integer uploadedBy);
    EventReport getReportByEventId(Integer eventId);
}
