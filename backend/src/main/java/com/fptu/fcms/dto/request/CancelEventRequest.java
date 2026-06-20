package com.fptu.fcms.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

@Data
public class CancelEventRequest {
    @NotBlank(message = "Lý do không được để trống.")
    @Size(min = 20, message = "Lý do hủy sự kiện phải có ít nhất 20 ký tự.")
    private String reason;
}
