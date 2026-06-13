package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClubStatusRequest {
    @NotBlank(message = "Status is required (Active/Inactive/Dissolved)")
    private String status;
}
