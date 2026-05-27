package com.fptu.fcms.membership.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class RecruitmentSubmitResponse {
    private Long applicationId;
    private String status;
    private LocalDateTime submittedAt;
}
