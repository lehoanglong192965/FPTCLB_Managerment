package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedbackInvitation;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.FeedbackInvitationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventFeedbackInvitationRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FeedbackInvitationScheduler {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventFeedbackInvitationRepository feedbackInvitationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${fcms.feedback.public-base-url:http://localhost:8080/api/guest-feedback/}")
    private String publicFeedbackBaseUrl;

    @Scheduled(cron = "0 */5 * * * ?")
    @Transactional
    public void sendFeedbackInvitations() {
        LocalDateTime now = LocalDateTime.now();
        for (Event event : eventRepository.findFeedbackOpenEvents(now)) {
            sendForEvent(event, now);
        }
    }

    @Scheduled(cron = "0 */15 * * * ?")
    @Transactional
    public void expireFeedbackInvitations() {
        LocalDateTime now = LocalDateTime.now();
        feedbackInvitationRepository
                .findByStatusAndExpiresAtBeforeAndIsDeletedFalse(FeedbackInvitationStatus.ACTIVE, now)
                .forEach(invitation -> invitation.setStatus(FeedbackInvitationStatus.EXPIRED));
    }

    private void sendForEvent(Event event, LocalDateTime now) {
        AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID()).orElse(null);
        if (session == null) {
            return;
        }

        var presentRecords = attendanceRecordRepository.findBySessionID(session.getSessionID()).stream()
                .filter(record -> AttendanceStatus.PRESENT.equals(record.getAttendanceStatus()))
                .toList();
        Set<Integer> presentRegistrationIds = presentRecords.stream()
                .map(AttendanceRecord::getRegistrationID)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Integer> presentGuestRegistrationIds = presentRecords.stream()
                .map(AttendanceRecord::getGuestRegistrationID)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (presentRegistrationIds.isEmpty() && presentGuestRegistrationIds.isEmpty()) {
            return;
        }

        for (EventRegistration registration : eventRegistrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID())) {
            if (!presentRegistrationIds.contains(registration.getRegistrationID())) {
                continue;
            }
            if (feedbackInvitationRepository.existsByEventIDAndRegistrationIDAndIsDeletedFalse(event.getEventID(), registration.getRegistrationID())) {
                continue;
            }
            String email = resolveEmail(registration);
            if (!StringUtils.hasText(email)) {
                continue;
            }
            createAndSendInvitation(event, registration, email, now);
        }

        for (GuestEventRegistration registration : guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID())) {
            if (!presentGuestRegistrationIds.contains(registration.getGuestRegistrationID())) {
                continue;
            }
            if (feedbackInvitationRepository.existsByEventIDAndGuestRegistrationIDAndIsDeletedFalse(event.getEventID(), registration.getGuestRegistrationID())) {
                continue;
            }
            if (!StringUtils.hasText(registration.getGuestEmail())) {
                continue;
            }
            createAndSendGuestInvitation(event, registration, now);
        }
    }

    private void createAndSendInvitation(Event event, EventRegistration registration, String email, LocalDateTime now) {
        String rawToken = generateToken();
        EventFeedbackInvitation invitation = new EventFeedbackInvitation();
        invitation.setEventID(event.getEventID());
        invitation.setRegistrationID(registration.getRegistrationID());
        invitation.setTokenHash(hash(rawToken));
        invitation.setExpiresAt(event.getFeedbackClosesAt() == null ? now.plusDays(7) : event.getFeedbackClosesAt());
        invitation.setStatus(FeedbackInvitationStatus.ACTIVE);
        invitation.setSentAt(now);
        invitation.setCreatedAt(now);
        invitation.setIsDeleted(false);
        feedbackInvitationRepository.save(invitation);

        sendFeedbackEmail(event, email, rawToken);
    }

    private void createAndSendGuestInvitation(Event event, GuestEventRegistration registration, LocalDateTime now) {
        String rawToken = generateToken();
        EventFeedbackInvitation invitation = new EventFeedbackInvitation();
        invitation.setEventID(event.getEventID());
        invitation.setGuestRegistrationID(registration.getGuestRegistrationID());
        invitation.setTokenHash(hash(rawToken));
        invitation.setExpiresAt(event.getFeedbackClosesAt() == null ? now.plusDays(7) : event.getFeedbackClosesAt());
        invitation.setStatus(FeedbackInvitationStatus.ACTIVE);
        invitation.setSentAt(now);
        invitation.setCreatedAt(now);
        invitation.setIsDeleted(false);
        feedbackInvitationRepository.save(invitation);

        sendFeedbackEmail(event, registration.getGuestEmail(), rawToken);
    }

    private void sendFeedbackEmail(Event event, String email, String rawToken) {
        String link = publicFeedbackBaseUrl.endsWith("/") ? publicFeedbackBaseUrl + rawToken : publicFeedbackBaseUrl + "/" + rawToken;
        emailService.sendSimpleEmail(
                email,
                "FCMS Event Feedback",
                "Please submit feedback for event " + event.getEventName() + " using this link: " + link
        );
    }

    private String resolveEmail(EventRegistration registration) {
        if (registration.getUserID() == null) {
            return registration.getGuestEmail();
        }
        return userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID())
                .map(UserAccount::getEmail)
                .orElse(null);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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
