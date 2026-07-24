package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;
import com.fptu.fcms.dto.request.EventWalkInRegistrationRequest;
import com.fptu.fcms.dto.request.RegistrationRejectRequest;
import com.fptu.fcms.dto.request.RegistrationCancelRequest;
import com.fptu.fcms.dto.response.RegistrationPageResponse;
import com.fptu.fcms.dto.response.MyRegistrationResponse;
import com.fptu.fcms.dto.response.EventRegistrationResultResponse;
import com.fptu.fcms.dto.request.ConfirmEventPaymentRequest;
import com.fptu.fcms.dto.request.GroupTicketPurchaseRequest;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;
import java.util.Map;

public interface EventRegistrationService {
    EventRegistrationResultResponse registerEvent(Integer eventID, Integer userID);
    EventRegistrationResultResponse registerGroupTickets(Integer eventID, Integer userID, GroupTicketPurchaseRequest request);
    MyRegistrationResponse confirmPayment(Integer registrationId, Integer userId, ConfirmEventPaymentRequest request);
    void registerGuestEvent(Integer eventID, EventGuestRegistrationRequest request);
    void registerWalkInEvent(Integer eventID, EventWalkInRegistrationRequest request, UserPrincipal currentUser);
    void unregisterEvent(Integer eventID, Integer userID);
    boolean isUserRegistered(Integer eventId, Integer userId);
    long countActiveTicketsPurchased(Integer eventId, Integer userId);
    Integer getActiveRegistrationId(Integer eventId, Integer userId);
    Map<String, Object> getRegistrationStatus(Integer eventId, Integer userId);
    List<com.fptu.fcms.entity.Event> getEventsByUserRegistered(Integer userId);

    List<MyRegistrationResponse> getMyRegistrationDetails(Integer userId);

    RegistrationPageResponse getRegistrations(
            Integer eventId,
            String participantType,
            String status,
            String keyword,
            int page,
            int size,
            String sortBy,
            String sortDir,
            UserPrincipal currentUser
    );

    void approveRegistration(Integer eventId, Integer registrationId, UserPrincipal currentUser);

    void rejectRegistration(Integer eventId, Integer registrationId, RegistrationRejectRequest request, UserPrincipal currentUser);

    void cancelRegistration(Integer registrationId, RegistrationCancelRequest request, UserPrincipal currentUser);

    default void cancelRegistration(Integer registrationId, UserPrincipal currentUser) {
        cancelRegistration(registrationId, null, currentUser);
    }

    void cancelTicketOrder(String ticketOrderCode, RegistrationCancelRequest request, UserPrincipal currentUser);

    void cancelGuestRegistration(Integer eventId, Integer guestRegistrationId, UserPrincipal currentUser);

    void approveGuestPayment(Integer eventId, Integer guestRegistrationId, UserPrincipal currentUser);

    void rejectGuestPayment(Integer eventId, Integer guestRegistrationId, RegistrationRejectRequest request, UserPrincipal currentUser);
}
