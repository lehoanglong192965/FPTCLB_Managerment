package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WithdrawEventRequest {
    @NotBlank(message = "Ly do rut yeu cau khong duoc de trong.")
    @Size(min = 20, max = 1000, message = "Ly do rut yeu cau phai co tu 20 den 1000 ky tu.")
    private String reason;
}
