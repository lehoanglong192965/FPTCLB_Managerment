package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.request.EventAssignmentRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.dto.response.EventDetailResponse;
import com.fptu.fcms.dto.response.ContributionDTO;
import com.fptu.fcms.dto.response.EventRegistrationPolicyResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;
import java.util.Map;

public interface EventService {
    void createEventProposal(CreateEventProposalRequest request, UserPrincipal currentUser);
    void submitEventProposal(Integer eventId, UserPrincipal currentUser);
    void addAssignment(Integer eventId, EventAssignmentRequest request);
    void removeAssignment(Integer eventId, Integer userId);
    void assignCheckInStaff(Integer eventId, Integer userId);
    void revokeCheckInStaff(Integer eventId, Integer userId);
    List<EventAssignment> getAssignments(Integer eventId);
    void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request);
    EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser);
    List<Event> getPendingEvents();
    List<Event> getApprovedEvents();
    List<Event> getIcpdpApprovedEvents();
    List<Event> getRejectedEvents();
    void deleteDraftEvent(Integer eventId, UserPrincipal currentUser);
    Event getEventById(Integer eventId);
    EventDetailResponse getPublicEventDetail(Integer eventId);
    EventDetailResponse getManagedEventDetail(Integer eventId, UserPrincipal currentUser);
    List<Event> getEventsByClubId(Integer clubId);
    String checkIn(Integer eventId, String studentId, UserPrincipal currentUser);
    void startEvent(Integer eventId);
    void finishEvent(Integer eventId);
    void closeEvent(Integer eventId);
    List<ContributionDTO> getEventContributions(Integer eventId);
    void saveEventContributions(Integer eventId, List<ContributionDTO> contributions);
    void approveEvent(Integer eventId, UserPrincipal currentUser);
    void rejectEvent(Integer eventId, String reason, UserPrincipal currentUser);
    void openRegistration(Integer eventId, UserPrincipal currentUser);
    void closeRegistration(Integer eventId, UserPrincipal currentUser);
    void updateEvent(Integer eventId, com.fptu.fcms.dto.request.UpdateEventRequest request);
    boolean isUserAssigned(Integer eventId, Integer userId);
    List<Event> getEventsByUserAssigned(Integer userId);
    List<Event> getReportUploadedEvents();
    List<Event> getReportReviewedEvents();
    List<Map<String, Object>> getCheckedInAttendees(Integer eventId);
    List<EventRegistrationPolicyResponse> getRegistrationPolicies(Integer eventId, UserPrincipal currentUser);
}