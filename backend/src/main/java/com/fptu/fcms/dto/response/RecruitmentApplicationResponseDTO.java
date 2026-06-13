package com.fptu.fcms.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RecruitmentApplicationResponseDTO {
    private Integer applicationID;
    private Integer clubID;
    private Integer userID;
    private Integer semesterID;
    private String cvUrl;
    private String introduction;
    private String answersJson;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
}
