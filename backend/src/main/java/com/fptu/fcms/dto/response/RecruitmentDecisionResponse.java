package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentDecisionResponse {
    private Integer applicationID;
    private Integer clubID;
    private Integer userID;
    private Integer semesterID;
    private String studentName;
    private String studentEmail;
    private String status;
    private BigDecimal interviewScore;
    private LocalDateTime interviewTime;
    private String interviewLocation;
}
