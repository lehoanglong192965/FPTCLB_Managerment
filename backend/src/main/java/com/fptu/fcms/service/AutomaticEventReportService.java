package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;
import com.fptu.fcms.security.UserPrincipal;

import java.util.Map;

public interface AutomaticEventReportService {
    EventReportSnapshot getAutoData(Integer eventId, UserPrincipal currentUser);

    byte[] previewAuto(Integer eventId, AutomaticEventReportRequest request, UserPrincipal currentUser);

    Map<String, String> submitAuto(Integer eventId, AutomaticEventReportRequest request, UserPrincipal currentUser);
}
