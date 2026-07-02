package com.fptu.fcms.service.statemachine;

import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Service
public class RegistrationStateMachineService {

    private static final Map<RegistrationStatus, Set<RegistrationStatus>> ALLOWED = new EnumMap<>(RegistrationStatus.class);

    static {
        ALLOWED.put(RegistrationStatus.PENDING_VERIFICATION, EnumSet.of(
                RegistrationStatus.PENDING_APPROVAL,
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.WAITLISTED,
                RegistrationStatus.REJECTED,
                RegistrationStatus.CANCELLED
        ));
        ALLOWED.put(RegistrationStatus.PENDING_APPROVAL, EnumSet.of(
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.WAITLISTED,
                RegistrationStatus.REJECTED,
                RegistrationStatus.CANCELLED
        ));
        ALLOWED.put(RegistrationStatus.WAITLISTED, EnumSet.of(
                RegistrationStatus.PROMOTED,
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.CANCELLED,
                RegistrationStatus.REJECTED
        ));
        ALLOWED.put(RegistrationStatus.PROMOTED, EnumSet.of(
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.CANCELLED
        ));
        ALLOWED.put(RegistrationStatus.CONFIRMED, EnumSet.of(RegistrationStatus.CANCELLED));
        ALLOWED.put(RegistrationStatus.CANCELLED, EnumSet.noneOf(RegistrationStatus.class));
        ALLOWED.put(RegistrationStatus.REJECTED, EnumSet.noneOf(RegistrationStatus.class));
    }

    public void validateTransition(RegistrationStatus from, RegistrationStatus to) {
        if (from == to) {
            return;
        }
        if (!ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
            throw new BusinessRuleException("REGISTRATION_TRANSITION_INVALID: " + from + " -> " + to);
        }
    }
}
