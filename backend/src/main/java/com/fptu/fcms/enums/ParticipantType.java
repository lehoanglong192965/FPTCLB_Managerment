package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Locale;

@Schema(description = "Participant type")
public enum ParticipantType {
    CORE_TEAM,
    SUPPORT_ORGANIZER,
    PARTICIPANT,
    GUEST;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static ParticipantType fromValue(String value) {
        if (value == null) {
            return null;
        }
        return ParticipantType.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
