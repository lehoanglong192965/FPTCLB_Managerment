package com.fptu.fcms.service.event;

public interface RegistrationAllocationService {

    RegistrationAllocationResult allocateInitial(Integer eventId, Integer maxParticipants, boolean requiresApproval);

    RegistrationAllocationResult allocateOnApproval(Integer eventId, Integer maxParticipants);

    int promoteWaitlisted(Integer eventId, Integer maxParticipants);
}
