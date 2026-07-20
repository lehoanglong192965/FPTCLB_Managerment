package com.fptu.fcms.service;

import com.fptu.fcms.security.UserPrincipal;

public interface EventAssignmentAccessService {
    void ensureCanManageEvent(Integer eventId, UserPrincipal currentUser);
    void ensureCanManageCheckIn(Integer eventId, UserPrincipal currentUser);
    boolean canViewGuestContact(Integer eventId, UserPrincipal currentUser);
}
