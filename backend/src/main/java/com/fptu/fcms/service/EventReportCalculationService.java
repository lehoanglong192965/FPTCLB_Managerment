package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EventReportingDataset;

public interface EventReportCalculationService {
    EventReportSnapshot calculateSnapshot(EventReportingDataset dataset);
}
