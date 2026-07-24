package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.EventStatus;

import java.time.LocalDateTime;

public record EventSubmissionResponse(
        Integer eventID,
        EventStatus eventStatus,
        Integer submissionAttemptCount,
        Integer attemptsRemaining,
        Integer maxSubmissionAttempts,
        Integer submissionCooldownHours,
        LocalDateTime lastSubmittedAt,
        LocalDateTime submissionBlockedUntil,
        String message
) {
}
