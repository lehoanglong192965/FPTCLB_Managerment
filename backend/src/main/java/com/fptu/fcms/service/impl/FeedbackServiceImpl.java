package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.EventFeedbackRequest;
import com.fptu.fcms.dto.request.FeedbackSubmitRequest;
import com.fptu.fcms.dto.response.EventFeedbackReportResponse;
import com.fptu.fcms.dto.response.EventFeedbackResponse;
import com.fptu.fcms.dto.response.FeedbackCompetitionInput;
import com.fptu.fcms.dto.response.FeedbackEligibilityResponse;
import com.fptu.fcms.dto.response.FeedbackGuestTokenResponse;
import com.fptu.fcms.dto.response.FeedbackSubmitResponse;
import com.fptu.fcms.dto.response.PendingFeedbackEventResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventFeedbackInvitation;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.FeedbackInvitationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventFeedbackInvitationRepository;
import com.fptu.fcms.repository.EventFeedbackRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.FeedbackService;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.FeedbackSummaryService;
import com.fptu.fcms.service.event.EventPermissionService;
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
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private static final List<String> CLUB_BOARD_ROLE_NAMES = List.of("Leader", "ViceLeader");
    private static final Set<EventStatus> FEEDBACK_REPORTABLE_STATUSES = Set.of(
            EventStatus.COMPLETED,
            EventStatus.CLOSED,
            EventStatus.REPORT_UPLOADED,
            EventStatus.REPORT_PENDING_APPROVAL,
            EventStatus.REPORT_APPROVED,
            EventStatus.REPORT_REJECTED,
            EventStatus.CONTRIBUTION_CALCULATED,
            EventStatus.CONTRIBUTION_DRAFT,
            EventStatus.CONTRIBUTION_PENDING_APPROVAL,
            EventStatus.CONTRIBUTION_APPROVED,
            EventStatus.CONTRIBUTION_SCORING,
            EventStatus.CONTRIBUTION_FINALIZED
    );

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventFeedbackRepository eventFeedbackRepository;
    private final EventFeedbackInvitationRepository eventFeedbackInvitationRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final FeedbackSummaryService feedbackSummaryService;
    private final EventPermissionService eventPermissionService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PendingFeedbackEventResponse> getPendingFeedbackEvents(Integer userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED");
        }
        LocalDateTime now = LocalDateTime.now();
        return eventRegistrationRepository.findByUserIDAndIsDeletedFalse(userId).stream()
                .filter(registration -> registration.getEventID() != null)
                .filter(registration -> !eventFeedbackRepository.existsByEventIDAndRegistrationIDAndIsDeletedFalse(
                        registration.getEventID(), registration.getRegistrationID()))
                .map(registration -> eventRepository.findByEventIDAndIsDeletedFalse(registration.getEventID())
                        .map(event -> new PendingCandidate(event, registration))
                        .orElse(null))
                .filter(Objects::nonNull)
                .filter(candidate -> !isHostClubMember(candidate.event(), userId))
                .filter(candidate -> isFeedbackOpenForEvent(candidate.event(), now))
                .filter(candidate -> hasPresentAttendance(candidate.event().getEventID(), candidate.registration().getRegistrationID()))
                .map(candidate -> new PendingFeedbackEventResponse(
                        candidate.event().getEventID(),
                        candidate.event().getEventName(),
                        candidate.event().getClubID(),
                        candidate.registration().getRegistrationID(),
                        candidate.event().getStartDate(),
                        candidate.event().getEndDate(),
                        candidate.event().getFeedbackOpensAt(),
                        candidate.event().getFeedbackClosesAt()
                ))
                .toList();
    }

    @Override
    @Transactional
    public EventFeedbackResponse submitEventFeedback(Integer eventId, EventFeedbackRequest request, Integer userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED");
        }
        Event event = findEvent(eventId);
        validateFeedbackWindowAndEventEnded(event, LocalDateTime.now());
        if (isHostClubMember(event, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "HOST_CLUB_MEMBER_CANNOT_FEEDBACK");
        }
        EventRegistration registration = eventRegistrationRepository
                .findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "REGISTRATION_NOT_FOUND"));
        validatePresentAttendance(eventId, registration.getRegistrationID());
        if (eventFeedbackRepository.existsByEventIDAndRegistrationIDAndIsDeletedFalse(eventId, registration.getRegistrationID())) {
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
        feedback.setIsIncludedInExternalScore(false);
        feedback.setSubmittedAt(LocalDateTime.now());
        feedback.setCreatedAt(feedback.getSubmittedAt());
        feedback.setIsDeleted(false);

        return toEventFeedbackResponse(eventFeedbackRepository.save(feedback));
    }

    @Override
    @Transactional(readOnly = true)
    public EventFeedbackReportResponse getFeedbackReport(Integer eventId, UserPrincipal principal) {
        Event event = findEvent(eventId);
        validateCanViewFeedbackReport(event, principal);
        List<EventFeedback> feedbacks = eventFeedbackRepository.findByEventIDAndIsDeletedFalseOrderBySubmittedAtDesc(eventId);
        long total = feedbacks.size();
        double avgContent = average(feedbacks.stream().map(EventFeedback::getContentRating).toList());
        double avgOrganization = average(feedbacks.stream().map(EventFeedback::getOrganizationRating).toList());
        double avgLogistics = average(feedbacks.stream().map(EventFeedback::getLogisticsRating).toList());
        double avgOverall = average(feedbacks.stream().map(EventFeedback::getOverallRating).toList());
        List<EventFeedbackReportResponse.FeedbackItem> items = feedbacks.stream()
                .map(feedback -> {
                    RespondentInfo respondent = resolveRespondentInfo(feedback);
                    return new EventFeedbackReportResponse.FeedbackItem(
                            feedback.getFeedbackID(),
                            feedback.getRegistrationID(),
                            feedback.getGuestRegistrationID(),
                            respondent.type(),
                            respondent.name(),
                            respondent.email(),
                            feedback.getContentRating(),
                            feedback.getOrganizationRating(),
                            feedback.getLogisticsRating(),
                            feedback.getOverallRating(),
                            feedback.getComment(),
                            feedbackTimestamp(feedback)
                    );
                })
                .toList();
        return new EventFeedbackReportResponse(
                event.getEventID(),
                event.getEventName(),
                total,
                avgContent,
                avgOrganization,
                avgLogistics,
                avgOverall,
                items
        );
    }

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
        if (FeedbackInvitationStatus.USED.equals(invitation.getStatus())) {
            return new FeedbackGuestTokenResponse(false, invitation.getEventID(), registrationId, guestRegistrationId, invitation.getExpiresAt(), "FEEDBACK_ALREADY_SUBMITTED");
        }
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
        if (FeedbackInvitationStatus.USED.equals(invitation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "FEEDBACK_ALREADY_SUBMITTED");
        }
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

    private void validateFeedbackWindowAndEventEnded(Event event, LocalDateTime now) {
        if (!isFeedbackOpenForEvent(event, now)) {
            if (!isEventEnded(event, now)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_NOT_ENDED");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FEEDBACK_NOT_ELIGIBLE");
        }
    }

    private boolean isFeedbackOpenForEvent(Event event, LocalDateTime now) {
        if (!isEventEnded(event, now)) {
            return false;
        }
        if (Boolean.FALSE.equals(event.getFeedbackEnabled())) {
            return false;
        }
        if (event.getFeedbackOpensAt() != null && event.getFeedbackOpensAt().isAfter(now)) {
            return false;
        }
        return event.getFeedbackClosesAt() == null || !event.getFeedbackClosesAt().isBefore(now);
    }

    private boolean isEventEnded(Event event, LocalDateTime now) {
        if (event.getEventStatus() != null && FEEDBACK_REPORTABLE_STATUSES.contains(event.getEventStatus())) {
            return true;
        }
        return event.getEndDate() != null && !event.getEndDate().isAfter(now);
    }

    private boolean isHostClubMember(Event event, Integer userId) {
        if (event == null || userId == null || event.getClubID() == null) {
            return false;
        }
        if (event.getSemesterID() != null) {
            return clubMembershipRepository
                    .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(event.getClubID(), userId, event.getSemesterID())
                    .isPresent();
        }
        return clubMembershipRepository.existsByClubIDAndUserIDAndIsDeletedFalse(event.getClubID(), userId);
    }
    private boolean hasPresentAttendance(Integer eventId, Integer registrationId) {
        return attendanceSessionRepository.findByEventID(eventId)
                .flatMap(session -> attendanceRecordRepository.findBySessionIDAndRegistrationID(session.getSessionID(), registrationId))
                .filter(attendance -> AttendanceStatus.PRESENT.equals(attendance.getAttendanceStatus()))
                .isPresent();
    }

    private void validatePresentAttendance(Integer eventId, Integer registrationId) {
        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "ATTENDANCE_NOT_PRESENT"));
        AttendanceRecord attendance = attendanceRecordRepository
                .findBySessionIDAndRegistrationID(session.getSessionID(), registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "ATTENDANCE_NOT_PRESENT"));
        if (!AttendanceStatus.PRESENT.equals(attendance.getAttendanceStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ATTENDANCE_NOT_PRESENT");
        }
    }

    private void validateCanViewFeedbackReport(Event event, UserPrincipal principal) {
        if (eventPermissionService.isIcpdp(principal)) {
            return;
        }
        if (principal == null || principal.getUserId() == null || !eventPermissionService.isLeader(principal)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "FEEDBACK_REPORT_FORBIDDEN");
        }
        Integer clubId = event.getClubID();
        if (clubId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "FEEDBACK_REPORT_FORBIDDEN");
        }
        boolean hostClubBoardMember = clubMembershipRepository.existsActiveMembershipByClubUserAndRoleNames(
                clubId,
                principal.getUserId(),
                CLUB_BOARD_ROLE_NAMES
        );
        boolean eventCreator = principal.getUserId().equals(event.getCreatedBy());
        if (!hostClubBoardMember && !eventCreator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "LEADER_NOT_IN_HOST_CLUB");
        }
    }

    private EventFeedbackResponse toEventFeedbackResponse(EventFeedback feedback) {
        return new EventFeedbackResponse(
                feedback.getFeedbackID(),
                feedback.getEventID(),
                feedback.getRegistrationID(),
                feedback.getContentRating(),
                feedback.getOrganizationRating(),
                feedback.getLogisticsRating(),
                feedback.getOverallRating(),
                feedback.getComment(),
                feedbackTimestamp(feedback),
                feedback.getUpdatedAt()
        );
    }

    private RespondentInfo resolveRespondentInfo(EventFeedback feedback) {
        if (feedback.getGuestRegistrationID() != null) {
            return guestEventRegistrationRepository.findByGuestRegistrationIDAndIsDeletedFalse(feedback.getGuestRegistrationID())
                    .map(registration -> new RespondentInfo(
                            "Guest",
                            registration.getGuestFullName(),
                            registration.getGuestEmail()
                    ))
                    .orElse(new RespondentInfo("Guest", "Khách tham dự", null));
        }

        if (feedback.getRegistrationID() != null) {
            return eventRegistrationRepository.findByRegistrationIDAndIsDeletedFalse(feedback.getRegistrationID())
                    .map(this::resolveMemberRespondentInfo)
                    .orElse(new RespondentInfo("Member", "Thành viên", null));
        }

        return new RespondentInfo("Unknown", "Người tham dự", null);
    }

    private RespondentInfo resolveMemberRespondentInfo(EventRegistration registration) {
        if (registration.getUserID() != null) {
            return userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID())
                    .map(user -> new RespondentInfo("Member", user.getFullName(), user.getEmail()))
                    .orElse(new RespondentInfo("Member", "Thành viên", null));
        }
        return new RespondentInfo(
                "Guest",
                registration.getGuestFullName(),
                registration.getGuestEmail()
        );
    }
    private LocalDateTime feedbackTimestamp(EventFeedback feedback) {
        return feedback.getCreatedAt() != null ? feedback.getCreatedAt() : feedback.getSubmittedAt();
    }

    private double average(List<Integer> ratings) {
        return ratings.stream()
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
    }

    private record PendingCandidate(Event event, EventRegistration registration) {
    }

    private record RespondentInfo(String type, String name, String email) {
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
