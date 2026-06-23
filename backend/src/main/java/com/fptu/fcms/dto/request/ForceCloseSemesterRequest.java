package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForceCloseSemesterRequest {
    @NotBlank(message = "reason không được để trống.")
    @Size(max = 1000, message = "reason không được vượt quá 1000 ký tự.")
    private String reason;
}
