package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClubRequest {
    @NotBlank(message = "Mã câu lạc bộ không được để trống")
    private String clubCode;

    @NotBlank(message = "Tên câu lạc bộ không được để trống")
    private String clubName;

    private String description;
    private String applicationFormQuestions;
    
    @NotBlank(message = "MSSV của Leader không được để trống")
    private String leaderStudentId;
}
