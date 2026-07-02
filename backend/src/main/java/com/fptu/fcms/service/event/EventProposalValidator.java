package com.fptu.fcms.service.event;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistrationPolicy;

import java.util.List;

public interface EventProposalValidator {
    void validate(Event event, List<EventRegistrationPolicy> policies);
}
