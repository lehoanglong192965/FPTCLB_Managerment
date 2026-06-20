package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.CancelEventRequest;

public interface EventService {
    void createEventProposal(CreateEventProposalRequest request);
    void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request);
}
