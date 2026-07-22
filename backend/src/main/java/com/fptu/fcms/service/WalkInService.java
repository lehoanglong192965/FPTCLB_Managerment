package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.request.WalkInFptuRequest;
import com.fptu.fcms.dto.request.WalkInGuestEmergencyOverrideRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;
import com.fptu.fcms.security.UserPrincipal;

public interface WalkInService {
    AttendanceCheckInResponse walkInFptu(Integer sessionId, WalkInFptuRequest request, UserPrincipal currentUser);

    GuestRegistrationResponse walkInGuest(Integer sessionId, GuestRegistrationRequest request, UserPrincipal currentUser);

    AttendanceCheckInResponse emergencyGuestOverride(Integer sessionId, WalkInGuestEmergencyOverrideRequest request, UserPrincipal currentUser);
}
