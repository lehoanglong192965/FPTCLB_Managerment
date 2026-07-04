package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppealCreateRequest {
    @Size(max = 2000)
    private String reason;
}
