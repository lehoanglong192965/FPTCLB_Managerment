package com.fptu.fcms.entity;

import com.fptu.fcms.enums.RegistrationStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class RegistrationStatusConverter implements AttributeConverter<RegistrationStatus, String> {

    @Override
    public String convertToDatabaseColumn(RegistrationStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public RegistrationStatus convertToEntityAttribute(String dbData) {
        return RegistrationStatus.fromValue(dbData);
    }
}
