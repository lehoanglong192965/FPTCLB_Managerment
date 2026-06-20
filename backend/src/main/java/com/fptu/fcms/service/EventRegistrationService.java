package com.fptu.fcms.service;

public interface EventRegistrationService {
    void registerEvent(Integer eventID, Integer userID);
    void unregisterEvent(Integer eventID, Integer userID);
}
