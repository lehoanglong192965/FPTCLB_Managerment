package com.fptu.fcms.service;

import com.fptu.fcms.security.UserPrincipal;

public interface EventExportService {
    byte[] exportRegistrations(Integer eventId, UserPrincipal currentUser);

    byte[] exportAttendance(Integer eventId, UserPrincipal currentUser);
}
