package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.dto.response.ContributionDTO;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;

public interface EventService {
    void createEventProposal(CreateEventProposalRequest request);
    void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request);
    EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser);
    List<Event> getPendingEvents();
    List<Event> getApprovedEvents();
    Event getEventById(Integer eventId);
    List<Event> getEventsByClubId(Integer clubId);
    void checkIn(Integer eventId, Integer userId);
    void finishEvent(Integer eventId);
    void closeEvent(Integer eventId);
    List<ContributionDTO> getEventContributions(Integer eventId);
    void saveEventContributions(Integer eventId, List<ContributionDTO> contributions);
    void approveEvent(Integer eventId);
    void rejectEvent(Integer eventId, String reason);
}