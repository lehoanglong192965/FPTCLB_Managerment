package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.security.UserPrincipal;

public interface EventReportingDatasetService {
    EventReportingDataset loadDataset(Integer eventId, UserPrincipal currentUser);
}
