package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.EventReportUploadRequest;
import com.fptu.fcms.dto.response.EventReportResponse;

public interface EventReportService {
    EventReportResponse uploadReport(Integer eventId, EventReportUploadRequest request, Integer uploadedBy);
}
