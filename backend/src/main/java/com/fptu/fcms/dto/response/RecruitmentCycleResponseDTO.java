package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentCycleResponseDTO {
    private Integer cycleID;
    private Integer clubID;
    private String clubName;
    private Integer parentCycleID;
    private Integer semesterID;
    private String semesterCode;
    private String title;
    private String questionsJson;
    private String status;
    private LocalDateTime createdAt;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime closedAt;
    private Boolean reminded;
}

