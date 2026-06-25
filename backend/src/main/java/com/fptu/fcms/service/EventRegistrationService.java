package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;

import java.util.List;

public interface EventRegistrationService {
    void registerEvent(Integer eventID, Integer userID);
    void registerGuestEvent(Integer eventID, EventGuestRegistrationRequest request);
    void unregisterEvent(Integer eventID, Integer userID);
    boolean isUserRegistered(Integer eventId, Integer userId);
    List<com.fptu.fcms.entity.Event> getEventsByUserRegistered(Integer userId);
}
