package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum VerificationMethod {
    STUDENT_CARD,
    FPT_ACCOUNT,
    PHONE_LAST4,
    MANUAL_OVERRIDE,
    QR_TICKET;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static VerificationMethod fromValue(String value) {
        if (value == null) {
            return null;
        }
        return VerificationMethod.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}