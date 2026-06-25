package com.fptu.fcms.service;

public interface AttendanceTokenService {
    String generateQrToken(Integer eventId, Integer userId);

    AttendanceTokenClaims parseAndValidateQrToken(String token);

    record AttendanceTokenClaims(Integer eventId, Integer userId, String nonce) {}
}
