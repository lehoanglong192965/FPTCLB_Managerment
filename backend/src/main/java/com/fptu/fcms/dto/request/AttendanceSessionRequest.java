package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AttendanceSessionRequest {
    @NotBlank
    @Size(max = 255)
    private String name;

    private LocalDateTime opensAt;
    private LocalDateTime closesAt;
}