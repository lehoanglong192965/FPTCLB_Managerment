package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Locale;

@Schema(description = "Event lifecycle status")
public enum EventStatus {
    DRAFT,
    PENDING,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    CANCELLED,
    REGISTRATION_OPEN,
    REGISTRATION_CLOSED,
    ONGOING,
    COMPLETED,
    CLOSED,
    REPORT_UPLOADED,
    CONTRIBUTION_CALCULATED,
    CHECKIN_OPEN,
    REPORT_PENDING_APPROVAL,
    REPORT_APPROVED,
    CONTRIBUTION_DRAFT,
    CONTRIBUTION_PENDING_APPROVAL,
    CONTRIBUTION_APPROVED, CONTRIBUTION_SCORING, CONTRIBUTION_FINALIZED;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static EventStatus fromValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim()
                .replace('-', '_')
                .replace(" ", "_")
                .toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "DRAFT" -> DRAFT;
            case "PENDING" -> PENDING;
            case "PENDING_APPROVAL", "PENDINGAPPROVAL" -> PENDING_APPROVAL;
            case "APPROVED" -> APPROVED;
            case "REJECTED" -> REJECTED;
            case "CANCELLED", "CANCELED" -> CANCELLED;
            case "REGISTRATION_OPEN", "REGISTRATIONOPEN" -> REGISTRATION_OPEN;
            case "REGISTRATION_CLOSED", "REGISTRATIONCLOSED" -> REGISTRATION_CLOSED;
            case "ONGOING" -> ONGOING;
            case "COMPLETED" -> COMPLETED;
            case "CLOSED" -> CLOSED;
            case "REPORT_UPLOADED", "REPORTUPLOADED" -> REPORT_UPLOADED;
            case "CONTRIBUTION_CALCULATED", "CONTRIBUTIONCALCULATED" -> CONTRIBUTION_CALCULATED;
            case "CHECKIN_OPEN", "CHECKINOPEN" -> CHECKIN_OPEN;
            case "REPORT_PENDING_APPROVAL", "REPORTPENDINGAPPROVAL" -> REPORT_PENDING_APPROVAL;
            case "REPORT_APPROVED", "REPORTAPPROVED" -> REPORT_APPROVED;
            case "CONTRIBUTION_DRAFT", "CONTRIBUTIONDRAFT" -> CONTRIBUTION_DRAFT;
            case "CONTRIBUTION_PENDING_APPROVAL", "CONTRIBUTIONPENDINGAPPROVAL" -> CONTRIBUTION_PENDING_APPROVAL;
            case "CONTRIBUTION_APPROVED", "CONTRIBUTIONAPPROVED" -> CONTRIBUTION_APPROVED;
            default -> EventStatus.valueOf(normalized);
        };
    }
}
