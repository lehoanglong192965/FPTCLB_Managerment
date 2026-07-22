package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.GuestOtpVerifyRequest;
import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.request.ConfirmEventPaymentRequest;
import com.fptu.fcms.dto.request.RegistrationCancelRequest;
import com.fptu.fcms.dto.response.GuestOtpVerifyResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;
import com.fptu.fcms.dto.response.GuestRegistrationStatusResponse;
import com.fptu.fcms.service.GuestRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GuestRegistrationController {

    private final GuestRegistrationService guestRegistrationService;

    @PostMapping("/events/{eventId}/guest-registrations")
    public ResponseEntity<GuestRegistrationResponse> create(
            @PathVariable Integer eventId,
            @Valid @RequestBody GuestRegistrationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guestRegistrationService.createGuestRegistration(eventId, request));
    }

    @PostMapping("/guest-registrations/{guestReference}/verify-otp")
    public ResponseEntity<GuestOtpVerifyResponse> verifyOtp(
            @PathVariable String guestReference,
            @Valid @RequestBody GuestOtpVerifyRequest request
    ) {
        return ResponseEntity.ok(guestRegistrationService.verifyOtp(guestReference, request));
    }

    @PostMapping("/guest-registrations/{guestReference}/resend-otp")
    public ResponseEntity<GuestRegistrationResponse> resendOtp(@PathVariable String guestReference) {
        return ResponseEntity.ok(guestRegistrationService.resendOtp(guestReference));
    }

    @GetMapping("/guest-registrations/{guestReference}")
    public ResponseEntity<GuestRegistrationStatusResponse> status(@PathVariable String guestReference) {
        return ResponseEntity.ok(guestRegistrationService.getStatus(guestReference));
    }

    @PostMapping("/guest-registrations/{guestReference}/cancel")
    public ResponseEntity<GuestRegistrationStatusResponse> cancel(
            @PathVariable String guestReference,
            @Valid @RequestBody(required = false) RegistrationCancelRequest request) {
        return ResponseEntity.ok(guestRegistrationService.cancel(guestReference, request == null ? null : request.getReason()));
    }
    @PostMapping("/guest-registrations/{guestReference}/confirm-payment")
    public ResponseEntity<GuestRegistrationStatusResponse> confirmPayment(
            @PathVariable String guestReference,
            @Valid @RequestBody ConfirmEventPaymentRequest request) {
        return ResponseEntity.ok(guestRegistrationService.confirmPayment(guestReference, request));
    }
}
