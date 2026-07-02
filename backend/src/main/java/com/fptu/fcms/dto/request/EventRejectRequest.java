package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "Request body used to reject an event")
public class EventRejectRequest {

    @Schema(description = "Reason for rejection")
    @NotBlank(message = "reason khong duoc de trong.")
    @Size(max = 1000, message = "reason khong duoc vuot qua 1000 ky tu.")
    private String reason;
}
