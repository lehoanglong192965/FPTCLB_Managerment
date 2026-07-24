package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.EventReportStatisticsResponse;
import com.fptu.fcms.security.UserPrincipal;

public interface EventReportStatisticsService {
    EventReportStatisticsResponse calculate(Integer eventId, UserPrincipal currentUser);
}
