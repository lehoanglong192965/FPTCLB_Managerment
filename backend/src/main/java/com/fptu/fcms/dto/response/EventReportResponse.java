package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventReportResponse {
    private Integer reportID;
    private Integer eventID;
    private String reportUrl;
    private String summary;
    private Integer uploadedBy;
    private LocalDateTime uploadedAt;
}
