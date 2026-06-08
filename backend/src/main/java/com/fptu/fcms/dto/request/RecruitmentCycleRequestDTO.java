package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentCycleRequestDTO {
    @NotBlank(message = "Title is required")
    private String title;

    /** JSON string describing the dynamic questions/form schema */
    @NotBlank(message = "questionsJson is required")
    private String questionsJson;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    /** Optional status: e.g., Open, Closed */
    private String status = "Open";
}

