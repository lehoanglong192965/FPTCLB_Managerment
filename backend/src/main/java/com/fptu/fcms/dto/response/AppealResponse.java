package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.AppealStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AppealResponse {
    private Integer appealID;
    private Integer batchID;
    private Integer eventID;
    private Integer contributionID;
    private Integer userID;
    private String reason;
    private String resolutionNote;
    private AppealStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime resolvedAt;
    private Integer resolvedBy;
}
