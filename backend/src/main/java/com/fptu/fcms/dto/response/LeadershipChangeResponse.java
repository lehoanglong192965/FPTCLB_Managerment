package com.fptu.fcms.dto.response;

import java.time.LocalDateTime;

/**
 * Kết quả trả về sau khi thay đổi Ban điều hành CLB.
 */
public record LeadershipChangeResponse(
        String        action,           // APPOINT | DISMISS
        Integer       clubID,
        Integer       targetUserID,
        String        targetUserFullName,
        String        newRole,          // null khi DISMISS
        Integer       semesterID,
        String        semesterCode,
        LocalDateTime changedAt,
        String        message
) {}
