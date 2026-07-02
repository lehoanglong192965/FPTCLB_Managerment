package com.fptu.fcms.service.statemachine;

import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AttendanceSessionStateMachineServiceTest {

    private final AttendanceSessionStateMachineService service = new AttendanceSessionStateMachineService();

    @Test
    void allowsDraftToOpen() {
        assertDoesNotThrow(() -> service.validateTransition(
                AttendanceSessionStatus.DRAFT,
                AttendanceSessionStatus.OPEN
        ));
    }

    @Test
    void rejectsClosedToOpen() {
        assertThrows(BusinessRuleException.class, () -> service.validateTransition(
                AttendanceSessionStatus.CLOSED,
                AttendanceSessionStatus.OPEN
        ));
    }
}
