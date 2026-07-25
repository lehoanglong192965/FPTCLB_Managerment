package com.fptu.fcms.service;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.GuestEventRegistration;

public interface GuestPaymentEmailService {
    void sendPaymentInstruction(GuestEventRegistration registration, Event event, String guestReference);
    void sendPaymentReminder(GuestEventRegistration registration, Event event);
    void sendVerificationReceived(GuestEventRegistration registration, Event event);
    void sendPaymentRejected(GuestEventRegistration registration, Event event);
    void sendPaymentExpired(GuestEventRegistration registration, Event event);
}
