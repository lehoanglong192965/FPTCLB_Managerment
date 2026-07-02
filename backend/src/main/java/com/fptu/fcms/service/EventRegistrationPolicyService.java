package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.EventRegistrationPolicyRequest;
import com.fptu.fcms.dto.response.EventRegistrationPolicyResponse;
import com.fptu.fcms.entity.EventRegistrationPolicy;
import com.fptu.fcms.security.UserPrincipal;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRegistrationPolicyService {
    List<EventRegistrationPolicyResponse> getPolicies(Integer eventId, UserPrincipal currentUser);

    void syncPolicies(Integer eventId, List<EventRegistrationPolicyRequest> requests, LocalDateTime now);

    void validateBeforeSubmit(Integer eventId);

    List<EventRegistrationPolicy> buildDefaultPolicies(Integer eventId, LocalDateTime now);
}
