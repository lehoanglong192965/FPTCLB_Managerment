package com.fptu.fcms.service;

import com.fptu.fcms.security.UserPrincipal;

public interface EventAssignmentAccessService {
    void ensureCanManageCheckIn(Integer eventId, UserPrincipal currentUser);
}
