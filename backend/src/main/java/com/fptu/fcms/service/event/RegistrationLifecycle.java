package com.fptu.fcms.service.event;

import java.util.List;

public final class RegistrationLifecycle {

    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";
    public static final String STATUS_WAITLISTED = "WAITLISTED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_REGISTERED = "REGISTERED";

    public static final String PARTICIPANT_TYPE_CORE_TEAM = "CORE_TEAM";
    public static final String PARTICIPANT_TYPE_SUPPORT_ORGANIZER = "SUPPORT_ORGANIZER";
    public static final String PARTICIPANT_TYPE_PARTICIPANT = "PARTICIPANT";

    public static final List<String> CONFIRMED_STATUSES = List.of(STATUS_CONFIRMED, STATUS_REGISTERED);
    public static final List<String> ACTIVE_STATUSES = List.of(
            STATUS_CONFIRMED,
            STATUS_PENDING_APPROVAL,
            STATUS_WAITLISTED,
            STATUS_REGISTERED
    );

    public static final List<String> PARTICIPANT_TYPES = List.of(
            PARTICIPANT_TYPE_CORE_TEAM,
            PARTICIPANT_TYPE_SUPPORT_ORGANIZER,
            PARTICIPANT_TYPE_PARTICIPANT
    );

    private RegistrationLifecycle() {
    }
}
