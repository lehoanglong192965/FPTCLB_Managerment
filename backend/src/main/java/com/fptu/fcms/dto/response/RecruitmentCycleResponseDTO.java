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
    private String title;
    private String questionsJson;
    private String status;
    private LocalDateTime createdAt;
    private LocalDate startDate;
    private LocalDateTime closedAt;
    private Boolean reminded;
}

