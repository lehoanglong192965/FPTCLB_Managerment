package com.fptu.fcms.service.statemachine;

import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RegistrationStateMachineServiceTest {

    private final RegistrationStateMachineService service = new RegistrationStateMachineService();

    @Test
    void allowsPendingVerificationToConfirmed() {
        assertDoesNotThrow(() -> service.validateTransition(
                RegistrationStatus.PENDING_VERIFICATION,
                RegistrationStatus.CONFIRMED
        ));
    }

    @Test
    void rejectsCancelledToConfirmed() {
        assertThrows(BusinessRuleException.class, () -> service.validateTransition(
                RegistrationStatus.CANCELLED,
                RegistrationStatus.CONFIRMED
        ));
    }
}
