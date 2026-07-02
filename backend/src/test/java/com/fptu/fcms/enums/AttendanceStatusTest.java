package com.fptu.fcms.enums;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class AttendanceStatusTest {

    @Test
    void attendanceStatusOnlyContainsPresentAndAbsent() {
        assertEquals(2, AttendanceStatus.values().length);
        assertFalse(Arrays.stream(AttendanceStatus.values()).anyMatch(status -> "LATE".equals(status.name())));
    }
}
