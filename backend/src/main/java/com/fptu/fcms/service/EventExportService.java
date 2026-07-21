package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.security.UserPrincipal;

public interface EventExportService {
    CsvExportResult exportRegistrations(Integer eventId, UserPrincipal currentUser);

    CsvExportResult exportAttendance(Integer eventId, UserPrincipal currentUser);
}
