package com.fptu.fcms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClubApplicationSummaryResponse {
    private Integer applicationId;
    private Integer userID;
    private String memberName;
    private String memberEmail;
    private String studentCode;
    private String introduction;
    private String cvUrl;
    private String status;
    private LocalDateTime createdAt;
}
