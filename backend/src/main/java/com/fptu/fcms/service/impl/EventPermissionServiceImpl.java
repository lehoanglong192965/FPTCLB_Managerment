package com.fptu.fcms.service.impl;

import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.event.EventPermissionService;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class EventPermissionServiceImpl implements EventPermissionService {

    private static final Set<String> LEADER_AUTHORITIES = Set.of("ROLE_Leader", "ROLE_ViceLeader");
    private static final Set<String> ICPDP_AUTHORITIES = Set.of("ROLE_ICPDP", "ROLE_Admin");
    private static final Set<String> WALK_IN_AUTHORITIES = Set.of("ROLE_Leader", "ROLE_ViceLeader", "ROLE_ICPDP", "ROLE_Admin");

    @Override
    public boolean isLeader(UserPrincipal principal) {
        return hasAnyAuthority(principal, LEADER_AUTHORITIES);
    }

    @Override
    public boolean isIcpdp(UserPrincipal principal) {
        return hasAnyAuthority(principal, ICPDP_AUTHORITIES);
    }

    @Override
    public boolean canManageRegistrations(UserPrincipal principal) {
        return hasAnyAuthority(principal, WALK_IN_AUTHORITIES);
    }

    @Override
    public boolean canCreateWalkIn(UserPrincipal principal) {
        return hasAnyAuthority(principal, WALK_IN_AUTHORITIES);
    }

    @Override
    public boolean canOverrideCapacity(UserPrincipal principal) {
        return hasAnyAuthority(principal, ICPDP_AUTHORITIES);
    }

    private boolean hasAnyAuthority(UserPrincipal principal, Set<String> authorities) {
        if (principal == null || principal.getAuthorities() == null) {
            return false;
        }
        return principal.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .anyMatch(authorities::contains);
    }
}
