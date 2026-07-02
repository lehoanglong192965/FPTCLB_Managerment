package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.ContributionBatchStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ContributionBatchResponse {
    private Integer batchID;
    private Integer eventID;
    private Integer clubID;
    private Integer semesterID;
    private ContributionBatchStatus status;
    private Integer reportApprovedBy;
    private LocalDateTime reportApprovedAt;
    private LocalDateTime scoringOpenedAt;
    private LocalDateTime scoringSubmittedAt;
    private Integer scoringSubmittedBy;
    private LocalDateTime appealOpenedAt;
    private LocalDateTime appealClosesAt;
    private LocalDateTime finalizedAt;
    private Integer finalizedBy;
}
