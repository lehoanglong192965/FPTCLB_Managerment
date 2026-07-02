package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceCorrectionRequest {
    @NotBlank
    private String attendanceStatus;

    @NotBlank
    private String overrideReason;

    private String note;
}