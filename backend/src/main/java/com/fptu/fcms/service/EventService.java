package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.request.EventAssignmentRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.dto.response.EventDetailResponse;
import com.fptu.fcms.dto.response.EventSubmissionResponse;
import com.fptu.fcms.dto.response.ContributionDTO;
import com.fptu.fcms.dto.response.EventRegistrationPolicyResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;
import java.util.Map;

public interface EventService {
    void createEventProposal(CreateEventProposalRequest request, UserPrincipal currentUser);
    EventSubmissionResponse submitEventProposal(Integer eventId, UserPrincipal currentUser);
    void addAssignment(Integer eventId, EventAssignmentRequest request, UserPrincipal currentUser);
    void removeAssignment(Integer eventId, Integer userId, UserPrincipal currentUser);
    void assignCheckInStaff(Integer eventId, Integer userId, UserPrincipal currentUser);
    void revokeCheckInStaff(Integer eventId, Integer userId, UserPrincipal currentUser);
    List<EventAssignment> getAssignments(Integer eventId, UserPrincipal currentUser);
    void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request, UserPrincipal currentUser);
    void withdrawEvent(Integer eventId, com.fptu.fcms.dto.request.WithdrawEventRequest request, UserPrincipal currentUser);
    EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser);
    List<Event> getPendingEvents();
    List<Event> getApprovedEvents();
    List<Event> getPublicEventsIncludingCompleted();
    List<Event> getIcpdpApprovedEvents();
    List<Event> getIcpdpAllEvents();
    List<Event> getRejectedEvents();
    Event getEventById(Integer eventId);
    EventDetailResponse getPublicEventDetail(Integer eventId, UserPrincipal currentUser);
    List<Event> getInternalEventsForMember(UserPrincipal currentUser);
    EventDetailResponse getManagedEventDetail(Integer eventId, UserPrincipal currentUser);
    List<Event> getEventsByClubId(Integer clubId);
    void startEvent(Integer eventId, UserPrincipal currentUser);
    void finishEvent(Integer eventId, UserPrincipal currentUser);
    void closeEvent(Integer eventId, UserPrincipal currentUser);
    List<ContributionDTO> getEventContributions(Integer eventId);
    void saveEventContributions(Integer eventId, List<ContributionDTO> contributions);
    void approveEvent(Integer eventId, UserPrincipal currentUser);
    void rejectEvent(Integer eventId, String reason, UserPrincipal currentUser);
    void openRegistration(Integer eventId, UserPrincipal currentUser);
    void closeRegistration(Integer eventId, UserPrincipal currentUser);
    // Internal scheduler-only operation; never expose this through a controller.
    void closeRegistrationAutomatically(Integer eventId);
    void updateEvent(Integer eventId, com.fptu.fcms.dto.request.UpdateEventRequest request, UserPrincipal currentUser);
    void deleteDraftEvent(Integer eventId, UserPrincipal currentUser);
    boolean isUserAssigned(Integer eventId, Integer userId);
    boolean isHostClubLeaderOrVice(Integer eventId, Integer userId);
    List<Event> getEventsByUserAssigned(Integer userId);
    List<Event> getReportUploadedEvents();
    List<Event> getReportReviewedEvents();
    List<Map<String, Object>> getCheckedInAttendees(Integer eventId, UserPrincipal currentUser);
    List<EventRegistrationPolicyResponse> getRegistrationPolicies(Integer eventId, UserPrincipal currentUser);
}
