package com.fptu.fcms.service.event;

import com.fptu.fcms.enums.RegistrationStatus;

public record RegistrationAllocationResult(
        RegistrationStatus status,
        boolean consumesSeat
) {
}
