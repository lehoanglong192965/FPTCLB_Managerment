package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewRegistrationRequestDTO {
    @NotBlank(message = "Trạng thái duyệt không được để trống")
    private String status; // APPROVED or REJECTED

    private String icpdpComment;
}
