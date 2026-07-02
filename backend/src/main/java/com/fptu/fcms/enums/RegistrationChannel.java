package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Locale;

@Schema(description = "Registration channel")
public enum RegistrationChannel {
    FPTU,
    ONLINE,
    WALK_IN;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static RegistrationChannel fromValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if ("GUEST".equals(normalized)) {
            return ONLINE;
        }
        return RegistrationChannel.valueOf(normalized);
    }
}
