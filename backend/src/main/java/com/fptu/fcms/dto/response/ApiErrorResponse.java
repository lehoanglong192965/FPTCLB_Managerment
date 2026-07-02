package com.fptu.fcms.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Schema(description = "Standard API error response")
public class ApiErrorResponse {
    @Schema(description = "Success flag", example = "false")
    private final boolean success;
    @Schema(description = "Timestamp of the error", example = "2026-07-01T12:00:00")
    private final LocalDateTime timestamp;
    @Schema(description = "HTTP status code", example = "422")
    private final int status;
    @Schema(description = "HTTP status text", example = "UNPROCESSABLE_ENTITY")
    private final String error;
    @Schema(description = "Stable machine-readable error code", example = "EVENT_STATE_INVALID")
    private final String code;
    @Schema(description = "Human-readable error message", example = "Event must be Approved before opening registration.")
    private final String message;
}
