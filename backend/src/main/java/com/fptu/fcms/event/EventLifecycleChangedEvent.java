package com.fptu.fcms.event;

public record EventLifecycleChangedEvent(
        Integer eventId,
        Integer clubId,
        Integer creatorId,
        String oldStatus,
        String newStatus,
        Integer actorId,
        String reason
) { }
