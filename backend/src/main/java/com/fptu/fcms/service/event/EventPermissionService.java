package com.fptu.fcms.service.event;

import com.fptu.fcms.security.UserPrincipal;

public interface EventPermissionService {
    boolean isLeader(UserPrincipal principal);
    boolean isIcpdp(UserPrincipal principal);
    boolean canManageRegistrations(UserPrincipal principal);
    boolean canCreateWalkIn(UserPrincipal principal);
    boolean canOverrideCapacity(UserPrincipal principal);
}
