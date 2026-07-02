package com.fptu.fcms.entity;

import com.fptu.fcms.enums.CheckInMethod;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class CheckInMethodConverter implements AttributeConverter<CheckInMethod, String> {

    @Override
    public String convertToDatabaseColumn(CheckInMethod attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public CheckInMethod convertToEntityAttribute(String dbData) {
        return CheckInMethod.fromValue(dbData);
    }
}
