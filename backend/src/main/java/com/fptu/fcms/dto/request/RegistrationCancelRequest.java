package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistrationCancelRequest {
    @Size(max = 500, message = "Cancellation reason must not exceed 500 characters.")
    private String reason;
}
