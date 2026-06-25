package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ContributionCalculationRequest {

    @NotNull(message = "eventID is required")
    private Integer eventID;

    @NotNull(message = "multiplier is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "multiplier must be between 0.0 and 1.5")
    @DecimalMax(value = "1.5", inclusive = true, message = "multiplier must be between 0.0 and 1.5")
    private BigDecimal multiplier;
}
