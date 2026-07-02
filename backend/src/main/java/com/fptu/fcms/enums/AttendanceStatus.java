package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Locale;

@Schema(description = "Attendance status")
public enum AttendanceStatus {
    PRESENT,
    ABSENT,
    LATE;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static AttendanceStatus fromValue(String value) {
        if (value == null) {
            return null;
        }
        return AttendanceStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
