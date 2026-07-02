package com.fptu.fcms.service.statemachine;

import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Service
public class AttendanceSessionStateMachineService {

    private static final Map<AttendanceSessionStatus, Set<AttendanceSessionStatus>> ALLOWED =
            new EnumMap<>(AttendanceSessionStatus.class);

    static {
        ALLOWED.put(AttendanceSessionStatus.DRAFT, EnumSet.of(AttendanceSessionStatus.OPEN, AttendanceSessionStatus.CLOSED));
        ALLOWED.put(AttendanceSessionStatus.OPEN, EnumSet.of(AttendanceSessionStatus.CLOSED));
        ALLOWED.put(AttendanceSessionStatus.CLOSED, EnumSet.noneOf(AttendanceSessionStatus.class));
    }

    public void validateTransition(AttendanceSessionStatus from, AttendanceSessionStatus to) {
        if (from == to) {
            return;
        }
        if (!ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
            throw new BusinessRuleException("ATTENDANCE_SESSION_TRANSITION_INVALID: " + from + " -> " + to);
        }
    }
}
