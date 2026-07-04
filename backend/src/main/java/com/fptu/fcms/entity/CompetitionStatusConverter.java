package com.fptu.fcms.entity;

import com.fptu.fcms.enums.CompetitionStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Locale;

@Converter(autoApply = true)
public class CompetitionStatusConverter implements AttributeConverter<CompetitionStatus, String> {

    @Override
    public String convertToDatabaseColumn(CompetitionStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public CompetitionStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return CompetitionStatus.valueOf(dbData.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return CompetitionStatus.DRAFT;
        }
    }
}
