package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;

public interface EventService {
    void createEventProposal(CreateEventProposalRequest request);
    void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request);
    EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser);
    List<Event> getPendingEvents();
    Event getEventById(Integer eventId);
    void approveEvent(Integer eventId);
    void rejectEvent(Integer eventId, String reason);
}