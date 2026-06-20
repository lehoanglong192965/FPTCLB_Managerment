package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.CancelEventRequest;

public interface EventService {
    void createEventProposal(CreateEventProposalRequest request);
    void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request);
    java.util.List<com.fptu.fcms.entity.Event> getPendingEvents();
    com.fptu.fcms.entity.Event getEventById(Integer eventId);
    void approveEvent(Integer eventId);
    void rejectEvent(Integer eventId, String reason);
}
