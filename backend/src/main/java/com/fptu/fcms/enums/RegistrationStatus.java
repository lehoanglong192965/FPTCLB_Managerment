package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Locale;

@Schema(description = "Registration status")
public enum RegistrationStatus {
    CONFIRMED,
    PENDING_APPROVAL,
    WAITLISTED,
    REJECTED,
    CANCELLED,
    REGISTERED;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static RegistrationStatus fromValue(String value) {
        if (value == null) {
            return null;
        }
        return RegistrationStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
