package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;
import com.fptu.fcms.dto.request.EventWalkInRegistrationRequest;
import com.fptu.fcms.dto.request.RegistrationRejectRequest;
import com.fptu.fcms.dto.response.RegistrationPageResponse;
import com.fptu.fcms.security.UserPrincipal;

import java.util.List;

public interface EventRegistrationService {
    void registerEvent(Integer eventID, Integer userID);
    void registerGuestEvent(Integer eventID, EventGuestRegistrationRequest request);
    void registerWalkInEvent(Integer eventID, EventWalkInRegistrationRequest request, UserPrincipal currentUser);
    void unregisterEvent(Integer eventID, Integer userID);
    boolean isUserRegistered(Integer eventId, Integer userId);
    List<com.fptu.fcms.entity.Event> getEventsByUserRegistered(Integer userId);

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

    void cancelRegistration(Integer registrationId, UserPrincipal currentUser);

    void cancelGuestRegistration(Integer eventId, Integer guestRegistrationId, UserPrincipal currentUser);
}
