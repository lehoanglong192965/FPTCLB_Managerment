package com.fptu.fcms.event;

import com.fptu.fcms.enums.EventStatus;

public record EventLifecycleChangedEvent(
        Integer eventId,
        Integer clubId,
        Integer creatorId,
        EventStatus oldStatus,
        EventStatus newStatus,
        Integer actorId,
        String reason
) { }
