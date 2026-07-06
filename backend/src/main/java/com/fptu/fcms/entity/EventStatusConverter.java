package com.fptu.fcms.entity;

import com.fptu.fcms.enums.EventStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class EventStatusConverter implements AttributeConverter<EventStatus, String> {

    @Override
    public String convertToDatabaseColumn(EventStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public EventStatus convertToEntityAttribute(String dbData) {
        return EventStatus.fromValue(dbData);
    }
}