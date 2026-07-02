package com.fptu.fcms.service.event;

import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationStatus;

import java.util.List;

public final class RegistrationLifecycle {

    public static final RegistrationStatus STATUS_CONFIRMED = RegistrationStatus.CONFIRMED;
    public static final RegistrationStatus STATUS_PENDING_APPROVAL = RegistrationStatus.PENDING_APPROVAL;
    public static final RegistrationStatus STATUS_WAITLISTED = RegistrationStatus.WAITLISTED;
    public static final RegistrationStatus STATUS_REJECTED = RegistrationStatus.REJECTED;
    public static final RegistrationStatus STATUS_CANCELLED = RegistrationStatus.CANCELLED;
    public static final RegistrationStatus STATUS_REGISTERED = RegistrationStatus.REGISTERED;

    public static final ParticipantType PARTICIPANT_TYPE_CORE_TEAM = ParticipantType.CORE_TEAM;
    public static final ParticipantType PARTICIPANT_TYPE_SUPPORT_ORGANIZER = ParticipantType.SUPPORT_ORGANIZER;
    public static final ParticipantType PARTICIPANT_TYPE_PARTICIPANT = ParticipantType.PARTICIPANT;

    public static final List<RegistrationStatus> CONFIRMED_STATUSES = List.of(STATUS_CONFIRMED, STATUS_REGISTERED);
    public static final List<RegistrationStatus> ACTIVE_STATUSES = List.of(
            STATUS_CONFIRMED,
            STATUS_PENDING_APPROVAL,
            STATUS_WAITLISTED,
            STATUS_REGISTERED
    );

    public static final List<ParticipantType> PARTICIPANT_TYPES = List.of(
            PARTICIPANT_TYPE_CORE_TEAM,
            PARTICIPANT_TYPE_SUPPORT_ORGANIZER,
            PARTICIPANT_TYPE_PARTICIPANT
    );

    private RegistrationLifecycle() {
    }
}
