package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import java.util.Map;

public interface ReportUploadService {
    Map<String, String> uploadEventReport(CreateEventReportRequest request);
}
