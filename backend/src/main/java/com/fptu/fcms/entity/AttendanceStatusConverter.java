package com.fptu.fcms.entity;

import com.fptu.fcms.enums.AttendanceStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class AttendanceStatusConverter implements AttributeConverter<AttendanceStatus, String> {

    @Override
    public String convertToDatabaseColumn(AttendanceStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public AttendanceStatus convertToEntityAttribute(String dbData) {
        return AttendanceStatus.fromValue(dbData);
    }
}
