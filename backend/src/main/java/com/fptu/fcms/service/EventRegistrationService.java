package com.fptu.fcms.service;

import java.util.List;

public interface EventRegistrationService {
    void registerEvent(Integer eventID, Integer userID);
    void unregisterEvent(Integer eventID, Integer userID);
    boolean isUserRegistered(Integer eventId, Integer userId);
    List<com.fptu.fcms.entity.Event> getEventsByUserRegistered(Integer userId);
}
