package com.fptu.fcms.service;

public interface EventCapacityService {
    boolean reserveSeat(Integer eventId, Integer maxParticipants);
    void releaseSeat(Integer eventId);
    void resetCapacity(Integer eventId, Integer maxParticipants);
}
