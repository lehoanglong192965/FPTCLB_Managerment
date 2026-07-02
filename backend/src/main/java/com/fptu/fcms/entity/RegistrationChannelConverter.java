package com.fptu.fcms.entity;

import com.fptu.fcms.enums.RegistrationChannel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class RegistrationChannelConverter implements AttributeConverter<RegistrationChannel, String> {

    @Override
    public String convertToDatabaseColumn(RegistrationChannel attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public RegistrationChannel convertToEntityAttribute(String dbData) {
        return RegistrationChannel.fromValue(dbData);
    }
}
