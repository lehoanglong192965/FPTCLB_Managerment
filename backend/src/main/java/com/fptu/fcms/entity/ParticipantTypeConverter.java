package com.fptu.fcms.entity;

import com.fptu.fcms.enums.ParticipantType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class ParticipantTypeConverter implements AttributeConverter<ParticipantType, String> {

    @Override
    public String convertToDatabaseColumn(ParticipantType attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public ParticipantType convertToEntityAttribute(String dbData) {
        return ParticipantType.fromValue(dbData);
    }
}
