package com.fptu.fcms.service.event;

import com.fptu.fcms.entity.Event;

public interface EventStateMachineService {
    void ensureCanOpenRegistration(Event event);
    void ensureCanCloseRegistration(Event event);
    void ensureCanApprove(Event event);
    void ensureCanReject(Event event);
    void ensureCanStart(Event event);
    void ensureCanFinish(Event event);
    void ensureCanClose(Event event);
    void ensureRegistrationWindowOpen(Event event);
    void ensureWalkInWindowOpen(Event event);
}
