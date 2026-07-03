package com.fptu.fcms.entity;

import com.fptu.fcms.enums.EventStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class EventStatusConverter implements AttributeConverter<EventStatus, String> {

    @Override
    public String convertToDatabaseColumn(EventStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case DRAFT -> "Draft";
            case PENDING -> "Pending";
            case PENDING_APPROVAL -> "PendingApproval";
            case APPROVED -> "Approved";
            case REJECTED -> "Rejected";
            case CANCELLED -> "Cancelled";
            case REGISTRATION_OPEN -> "RegistrationOpen";
            case REGISTRATION_CLOSED -> "RegistrationClosed";
            case ONGOING -> "Ongoing";
            case COMPLETED -> "Completed";
            case CLOSED -> "Closed";
            case REPORT_UPLOADED -> "ReportUploaded";
            case CONTRIBUTION_CALCULATED -> "ContributionCalculated";
            case CHECKIN_OPEN -> "CHECKIN_OPEN";
            case REPORT_PENDING_APPROVAL -> "REPORT_PENDING_APPROVAL";
            case REPORT_APPROVED -> "REPORT_APPROVED";
            case CONTRIBUTION_DRAFT -> "CONTRIBUTION_DRAFT";
            case CONTRIBUTION_PENDING_APPROVAL -> "CONTRIBUTION_PENDING_APPROVAL";
            case CONTRIBUTION_APPROVED -> "CONTRIBUTION_APPROVED";
            case CONTRIBUTION_SCORING -> "CONTRIBUTION_SCORING";
            case CONTRIBUTION_FINALIZED -> "CONTRIBUTION_FINALIZED";
        };
    }

    @Override
    public EventStatus convertToEntityAttribute(String dbData) {
        return EventStatus.fromValue(dbData);
    }
}
