package com.fptu.fcms.service.event;

public record RegistrationAllocationResult(
        String status,
        boolean consumesSeat
) {
}
