package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WalkInFptuRequest {
    @NotBlank
    private String studentIdOrEmail;
}