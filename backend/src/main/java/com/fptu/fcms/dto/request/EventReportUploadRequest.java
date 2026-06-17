package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EventReportUploadRequest {
    @NotBlank(message = "reportUrl is required")
    private String reportUrl;

    private String summary;
}
