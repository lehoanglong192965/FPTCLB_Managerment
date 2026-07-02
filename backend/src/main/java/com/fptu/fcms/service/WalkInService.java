package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.request.WalkInFptuRequest;
import com.fptu.fcms.dto.request.WalkInGuestEmergencyOverrideRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;

public interface WalkInService {
    AttendanceCheckInResponse walkInFptu(Integer sessionId, WalkInFptuRequest request, Integer actorId);

    GuestRegistrationResponse walkInGuest(Integer sessionId, GuestRegistrationRequest request);

    AttendanceCheckInResponse emergencyGuestOverride(Integer sessionId, WalkInGuestEmergencyOverrideRequest request, Integer actorId);
}