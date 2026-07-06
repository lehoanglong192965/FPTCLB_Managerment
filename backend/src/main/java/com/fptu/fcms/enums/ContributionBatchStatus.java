package com.fptu.fcms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ContributionBatchStatus {
    DRAFT,
    APPEAL_WINDOW,
    FINALIZED,
    @Deprecated
    SCORING,
    @Deprecated
    APPEAL_OPEN,
    @Deprecated
    APPEAL_RESOLUTION;

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static ContributionBatchStatus fromValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim()
                .replace('-', '_')
                .replace(" ", "_")
                .toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "DRAFT" -> DRAFT;
            case "SCORING" -> SCORING;
            case "APPEAL_WINDOW", "APPEALWINDOW" -> APPEAL_WINDOW;
            case "APPEAL_OPEN", "APPEALOPEN" -> APPEAL_OPEN;
            case "APPEAL_RESOLUTION", "APPEALRESOLUTION" -> APPEAL_RESOLUTION;
            case "FINALIZED" -> FINALIZED;
            default -> ContributionBatchStatus.valueOf(normalized);
        };
    }
}
