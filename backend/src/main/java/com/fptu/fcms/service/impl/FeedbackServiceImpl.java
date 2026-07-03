package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.FeedbackSubmitRequest;
import com.fptu.fcms.dto.response.FeedbackCompetitionInput;
import com.fptu.fcms.dto.response.FeedbackEligibilityResponse;
import com.fptu.fcms.dto.response.FeedbackGuestTokenResponse;
import com.fptu.fcms.dto.response.FeedbackSubmitResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventFeedbackInvitation;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.FeedbackInvitationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventFeedbackInvitationRepository;
import com.fptu.fcms.repository.EventFeedbackRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.service.FeedbackService;
import com.fptu.fcms.service.FeedbackSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventFeedbackRepository eventFeedbackRepository;
    private final EventFeedbackInvitationRepository eventFeedbackInvitationRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final FeedbackSummaryService feedbackSummaryService;

    @Override
    @Transactional(readOnly = true)
    public FeedbackEligibilityResponse checkEligibility(Integer eventId, Integer userId) {
        if (userId == null) {
            return new FeedbackEligibilityResponse(false, eventId, null, "AUTH_REQUIRED");
        }

        Event event = findEvent(eventId);
        EventRegistration registration = eventRegistrationRepository
                .findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .orElse(null);
        if (registration == null) {
            return new FeedbackEligibilityResponse(false, eventId, null, "REGISTRATION_NOT_FOUND");
        }
        if (eventFeedbackRepository.existsByEventIDAndRegistrationIDAndIsDeletedFalse(eventId, registration.getRegistrationID())) {
            return new FeedbackEligibilityResponse(false, eventId, registration.getRegistrationID(), "FEEDBACK_ALREADY_SUBMITTED");
        }

        try {
            validateFeedbackEligibility(event, registration);
            return new FeedbackEligibilityResponse(true, eventId, registration.getRegistrationID(), null);
        } catch (ResponseStatusException ex) {
            return new FeedbackEligibilityResponse(false, eventId, registration.getRegistrationID(), ex.getReason());
        }
    }

    @Override
    @Transactional
    public FeedbackSubmitResponse submitFptu(Integer eventId, FeedbackSubmitRequest request, Integer userId) {
        Event event = findEvent(eventId);
        if (request.getRegistrationId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REGISTRATION_ID_REQUIRED");
        }
        EventRegistration registration = findRegistration(request.getRegistrationId());
        if (!eventId.equals(registration.getEventID())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REGISTRATION_NOT_IN_EVENT");
        }
        if (registration.getUserID() == null || !registration.getUserID().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "FEEDBACK_NOT_OWNER");
        }
        validateFeedbackEligibility(event, registration);
        return saveFeedback(event, registration, request);
    }

    @Override
    @Transactional
    public FeedbackGuestTokenResponse validateGuestToken(String feedbackToken) {
        EventFeedbackInvitation invitation = eventFeedbackInvitationRepository
                .findByTokenHashAndIsDeletedFalse(hash(feedbackToken))
                .orElse(null);
        if (invitation == null) {
            return new FeedbackGuestTokenResponse(false, null, null, null, null, "FEEDBACK_TOKEN_INVALID");
        }

        LocalDateTime now = LocalDateTime.now();
        Integer registrationId = responseRegistrationId(invitation);
        Integer guestRegistrationId = invitation.getGuestRegistrationID();
        if (!FeedbackInvitationStatus.ACTIVE.equals(invitation.getStatus())) {
            return new FeedbackGuestTokenResponse(false, invitation.getEventID(), registrationId, guestRegistrationId, invitation.getExpiresAt(), "FEEDBACK_TOKEN_INVALID");
        }
        if (invitation.getExpiresAt().isBefore(now)) {
            invitation.setStatus(FeedbackInvitationStatus.EXPIRED);
            return new FeedbackGuestTokenResponse(false, invitation.getEventID(), registrationId, guestRegistrationId, invitation.getExpiresAt(), "FEEDBACK_TOKEN_EXPIRED");
        }
        if (feedbackAlreadySubmitted(invitation)) {
            return new FeedbackGuestTokenResponse(false, invitation.getEventID(), registrationId, guestRegistrationId, invitation.getExpiresAt(), "FEEDBACK_ALREADY_SUBMITTED");
        }

        return new FeedbackGuestTokenResponse(true, invitation.getEventID(), registrationId, guestRegistrationId, invitation.getExpiresAt(), null);
    }

    @Override
    @Transactional
    public FeedbackSubmitResponse submitGuest(String feedbackToken, FeedbackSubmitRequest request) {
        EventFeedbackInvitation invitation = eventFeedbackInvitationRepository.findByTokenHashAndIsDeletedFalse(hash(feedbackToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FEEDBACK_TOKEN_INVALID"));
        LocalDateTime now = LocalDateTime.now();
        if (!FeedbackInvitationStatus.ACTIVE.equals(invitation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_TOKEN_INVALID");
        }
        if (invitation.getExpiresAt().isBefore(now)) {
            invitation.setStatus(FeedbackInvitationStatus.EXPIRED);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_TOKEN_EXPIRED");
        }

        Event event = findEvent(invitation.getEventID());
        FeedbackSubmitResponse response;
        if (invitation.getGuestRegistrationID() != null) {
            GuestEventRegistration registration = findGuestRegistration(invitation.getGuestRegistrationID());
            Integer requestedGuestRegistrationId = request.getGuestRegistrationId() != null
                    ? request.getGuestRegistrationId()
                    : request.getRegistrationId();
            if (!registration.getGuestRegistrationID().equals(requestedGuestRegistrationId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "FEEDBACK_TOKEN_INVALID");
            }
            validateGuestFeedbackEligibility(event, registration);
            response = saveGuestFeedback(event, registration, request);
        } else {
            if (request.getRegistrationId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REGISTRATION_ID_REQUIRED");
            }
            EventRegistration registration = findRegistration(invitation.getRegistrationID());
            if (!registration.getRegistrationID().equals(request.getRegistrationId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "FEEDBACK_TOKEN_INVALID");
            }
            validateFeedbackEligibility(event, registration);
            response = saveFeedback(event, registration, request);
        }

        invitation.setStatus(FeedbackInvitationStatus.USED);
        invitation.setUsedAt(now);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackCompetitionInput summary(Integer eventId) {
        return feedbackSummaryService.getCompetitionInput(eventId);
    }

    private FeedbackSubmitResponse saveFeedback(Event event, EventRegistration registration, FeedbackSubmitRequest request) {
        if (eventFeedbackRepository.existsByEventIDAndRegistrationIDAndIsDeletedFalse(event.getEventID(), registration.getRegistrationID())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "FEEDBACK_ALREADY_SUBMITTED");
        }
        EventFeedback feedback = new EventFeedback();
        feedback.setEventID(event.getEventID());
        feedback.setRegistrationID(registration.getRegistrationID());
        feedback.setContentRating(request.getContentRating());
        feedback.setOrganizationRating(request.getOrganizationRating());
        feedback.setLogisticsRating(request.getLogisticsRating());
        feedback.setOverallRating(request.getOverallRating());
        feedback.setComment(request.getComment());
        feedback.setIsIncludedInExternalScore(isExternalParticipant(event, registration));
        feedback.setSubmittedAt(LocalDateTime.now());
        feedback.setIsDeleted(false);
        EventFeedback saved = eventFeedbackRepository.save(feedback);
        return new FeedbackSubmitResponse(
                saved.getFeedbackID(),
                saved.getEventID(),
                saved.getRegistrationID(),
                null,
                Boolean.TRUE.equals(saved.getIsIncludedInExternalScore()),
                saved.getSubmittedAt()
        );
    }

    private FeedbackSubmitResponse saveGuestFeedback(Event event, GuestEventRegistration registration, FeedbackSubmitRequest request) {
        if (eventFeedbackRepository.existsByEventIDAndGuestRegistrationIDAndIsDeletedFalse(event.getEventID(), registration.getGuestRegistrationID())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "FEEDBACK_ALREADY_SUBMITTED");
        }
        EventFeedback feedback = new EventFeedback();
        feedback.setEventID(event.getEventID());
        feedback.setGuestRegistrationID(registration.getGuestRegistrationID());
        feedback.setContentRating(request.getContentRating());
        feedback.setOrganizationRating(request.getOrganizationRating());
        feedback.setLogisticsRating(request.getLogisticsRating());
        feedback.setOverallRating(request.getOverallRating());
        feedback.setComment(request.getComment());
        feedback.setIsIncludedInExternalScore(true);
        feedback.setSubmittedAt(LocalDateTime.now());
        feedback.setIsDeleted(false);
        EventFeedback saved = eventFeedbackRepository.save(feedback);
        return new FeedbackSubmitResponse(
                saved.getFeedbackID(),
                saved.getEventID(),
                null,
                saved.getGuestRegistrationID(),
                true,
                saved.getSubmittedAt()
        );
    }

    private void validateFeedbackEligibility(Event event, EventRegistration registration) {
        LocalDateTime now = LocalDateTime.now();
        validateFeedbackWindow(event, now);
        AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE"));
        AttendanceRecord attendance = attendanceRecordRepository
                .findBySessionIDAndRegistrationID(session.getSessionID(), registration.getRegistrationID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE"));
        if (!AttendanceStatus.PRESENT.equals(attendance.getAttendanceStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE");
        }
    }

    private void validateGuestFeedbackEligibility(Event event, GuestEventRegistration registration) {
        LocalDateTime now = LocalDateTime.now();
        validateFeedbackWindow(event, now);
        AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE"));
        AttendanceRecord attendance = attendanceRecordRepository
                .findBySessionIDAndGuestRegistrationID(session.getSessionID(), registration.getGuestRegistrationID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE"));
        if (!AttendanceStatus.PRESENT.equals(attendance.getAttendanceStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE");
        }
    }

    private void validateFeedbackWindow(Event event, LocalDateTime now) {
        if (Boolean.FALSE.equals(event.getFeedbackEnabled())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE");
        }
        if (event.getFeedbackOpensAt() != null && event.getFeedbackOpensAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE");
        }
        if (event.getFeedbackClosesAt() != null && event.getFeedbackClosesAt().isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE");
        }
    }

    private boolean feedbackAlreadySubmitted(EventFeedbackInvitation invitation) {
        if (invitation.getGuestRegistrationID() != null) {
            return eventFeedbackRepository.existsByEventIDAndGuestRegistrationIDAndIsDeletedFalse(
                    invitation.getEventID(),
                    invitation.getGuestRegistrationID()
            );
        }
        return eventFeedbackRepository.existsByEventIDAndRegistrationIDAndIsDeletedFalse(
                invitation.getEventID(),
                invitation.getRegistrationID()
        );
    }

    private Integer responseRegistrationId(EventFeedbackInvitation invitation) {
        return invitation.getRegistrationID() != null
                ? invitation.getRegistrationID()
                : invitation.getGuestRegistrationID();
    }

    private boolean isExternalParticipant(Event event, EventRegistration registration) {
        if (registration.getUserID() == null) {
            return true;
        }
        if (event.getClubID() == null) {
            return true;
        }
        boolean hostClubMember = event.getSemesterID() == null
                ? clubMembershipRepository.existsByClubIDAndUserIDAndIsDeletedFalse(event.getClubID(), registration.getUserID())
                : clubMembershipRepository.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(event.getClubID(), registration.getUserID(), event.getSemesterID()).isPresent();
        return !hostClubMember;
    }

    private Event findEvent(Integer eventId) {
        return eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
    }

    private EventRegistration findRegistration(Integer registrationId) {
        return (EventRegistration) eventRegistrationRepository.findByRegistrationIDAndIsDeletedFalse(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "REGISTRATION_NOT_FOUND"));
    }

    private GuestEventRegistration findGuestRegistration(Integer guestRegistrationId) {
        return guestEventRegistrationRepository.findByGuestRegistrationIDAndIsDeletedFalse(guestRegistrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "REGISTRATION_NOT_FOUND"));
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}

