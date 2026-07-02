package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Locale;

@Schema(description = "Check-in method")
public enum CheckInMethod {
    STAFF_LOOKUP,
    MANUAL,
    AUTO,
    WALK_IN,
    EMERGENCY_OVERRIDE;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static CheckInMethod fromValue(String value) {
        if (value == null) {
            return null;
        }
        return CheckInMethod.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
