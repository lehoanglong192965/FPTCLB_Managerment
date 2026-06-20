package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.security.UserPrincipal;

public interface EventService {
    void createEventProposal(CreateEventProposalRequest request);
    void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request);
    EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser);
}