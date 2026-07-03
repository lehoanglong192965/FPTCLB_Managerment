package com.fptu.fcms.entity;

import com.fptu.fcms.enums.CompetitionStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Locale;

@Converter(autoApply = false)
public class CompetitionStatusConverter implements AttributeConverter<CompetitionStatus, String> {

    @Override
    public String convertToDatabaseColumn(CompetitionStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case Draft -> "DRAFT";
            case Published -> "PUBLISHED";
            case DRAFT -> "Draft";
            case OPEN -> "Open";
            case CLOSED -> "Closed";
            case Approved -> "Approved";
            case Rejected -> "Rejected";
            case Calculated -> "Calculated";
        };
    }

    @Override
    public CompetitionStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        String normalized = dbData.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "DRAFT" -> CompetitionStatus.DRAFT;
            case "OPEN" -> CompetitionStatus.OPEN;
            case "CLOSED" -> CompetitionStatus.CLOSED;
            default -> CompetitionStatus.DRAFT;
        };
    }
}
