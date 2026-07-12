package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.FeedbackCompetitionInput;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.FeedbackAssessmentStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventFeedbackRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackSummaryServiceImplTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventRegistrationRepository eventRegistrationRepository;
    @Mock
    private GuestEventRegistrationRepository guestEventRegistrationRepository;
    @Mock
    private AttendanceSessionRepository attendanceSessionRepository;
    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;
    @Mock
    private EventFeedbackRepository eventFeedbackRepository;
    @Mock
    private ClubMembershipRepository clubMembershipRepository;

    @InjectMocks
    private FeedbackSummaryServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "minEligibleExternalPresent", 2);
        ReflectionTestUtils.setField(service, "minResponseCount", 1);
        ReflectionTestUtils.setField(service, "minResponseRate", 0.20);
        ReflectionTestUtils.setField(service, "goodAverageRating", 4.0);
        ReflectionTestUtils.setField(service, "goodPositiveRate", 0.70);
    }

    @Test
    void returnsInsufficientSampleWhenEligibleExternalPresentBelowThreshold() {
        arrangeEvent(
                List.of(),
                List.of(guestRegistration(1)),
                List.of(guestRecord(1)),
                List.of(guestFeedback(1, 5, true))
        );

        FeedbackCompetitionInput input = service.getCompetitionInput(99);

        assertEquals(FeedbackAssessmentStatus.INSUFFICIENT_SAMPLE, input.getFeedbackAssessmentStatus());
        assertEquals(1, input.getEligibleExternalPresentCount());
    }

    @Test
    void returnsGoodWhenAverageAndPositiveRateMeetThresholds() {
        arrangeEvent(
                List.of(fptuParticipantRegistration(2)),
                List.of(guestRegistration(1)),
                List.of(guestRecord(1), record(2)),
                List.of(guestFeedback(1, 5, true), feedback(2, 4, true))
        );

        FeedbackCompetitionInput input = service.getCompetitionInput(99);

        assertEquals(FeedbackAssessmentStatus.GOOD, input.getFeedbackAssessmentStatus());
        assertEquals(2, input.getEligibleExternalPresentCount());
        assertEquals(2, input.getExternalFeedbackResponseCount());
        assertTrue(input.getAverageOverallRating() >= 4.0);
    }

    @Test
    void returnsNotGoodWhenSampleIsEnoughButScoresMissThreshold() {
        arrangeEvent(
                List.of(fptuParticipantRegistration(2)),
                List.of(guestRegistration(1)),
                List.of(guestRecord(1), record(2)),
                List.of(guestFeedback(1, 3, true), feedback(2, 4, true))
        );

        FeedbackCompetitionInput input = service.getCompetitionInput(99);

        assertEquals(FeedbackAssessmentStatus.NOT_GOOD, input.getFeedbackAssessmentStatus());
    }

    @Test
    void excludesHostClubMemberFromEligibleExternalParticipants() {
        arrangeEvent(
                List.of(fptuParticipantRegistration(2), fptuParticipantRegistration(3)),
                List.of(guestRegistration(1)),
                List.of(guestRecord(1), record(2), record(3)),
                List.of(
                        guestFeedback(1, 5, true),
                        feedback(2, 5, true),
                        feedback(3, 5, true)
                )
        );
        when(clubMembershipRepository.existsByClubIDAndUserIDAndIsDeletedFalse(7, 103))
                .thenReturn(true);

        FeedbackCompetitionInput input = service.getCompetitionInput(99);

        assertEquals(2, input.getEligibleExternalPresentCount());
        assertEquals(2, input.getExternalFeedbackResponseCount());
        assertEquals(FeedbackAssessmentStatus.GOOD, input.getFeedbackAssessmentStatus());
    }

    private void arrangeEvent(
            List<EventRegistration> registrations,
            List<GuestEventRegistration> guestRegistrations,
            List<AttendanceRecord> records,
            List<EventFeedback> feedbacks
    ) {
        Event event = new Event();
        event.setEventID(99);
        event.setClubID(7);

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(123);
        session.setEventID(99);

        when(eventRepository.findByEventIDAndIsDeletedFalse(99)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndIsDeletedFalse(99)).thenReturn(registrations);
        when(guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(99))
                .thenReturn(guestRegistrations);
        when(attendanceSessionRepository.findByEventID(99)).thenReturn(Optional.of(session));
        when(attendanceRecordRepository.findBySessionID(123)).thenReturn(records);
        when(eventFeedbackRepository.findByEventIDAndIsDeletedFalse(99)).thenReturn(feedbacks);
        registrations.stream()
                .map(EventRegistration::getUserID)
                .filter(userId -> userId != null)
                .forEach(userId -> when(clubMembershipRepository
                        .existsByClubIDAndUserIDAndIsDeletedFalse(7, userId))
                        .thenReturn(false));
    }

    private GuestEventRegistration guestRegistration(Integer id) {
        GuestEventRegistration registration = new GuestEventRegistration();
        registration.setGuestRegistrationID(id);
        registration.setEventID(99);
        return registration;
    }

    private EventRegistration fptuParticipantRegistration(Integer id) {
        EventRegistration registration = baseRegistration(id);
        registration.setUserID(100 + id);
        registration.setParticipantType(RegistrationLifecycle.PARTICIPANT_TYPE_PARTICIPANT);
        return registration;
    }

    private EventRegistration baseRegistration(Integer id) {
        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(id);
        registration.setEventID(99);
        return registration;
    }

    private AttendanceRecord record(Integer registrationId) {
        AttendanceRecord record = new AttendanceRecord();
        record.setRegistrationID(registrationId);
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        return record;
    }

    private AttendanceRecord guestRecord(Integer guestRegistrationId) {
        AttendanceRecord record = new AttendanceRecord();
        record.setGuestRegistrationID(guestRegistrationId);
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        return record;
    }

    private EventFeedback feedback(Integer registrationId, Integer rating, boolean external) {
        EventFeedback feedback = new EventFeedback();
        feedback.setRegistrationID(registrationId);
        feedback.setEventID(99);
        feedback.setOverallRating(rating);
        feedback.setIsIncludedInExternalScore(external);
        return feedback;
    }

    private EventFeedback guestFeedback(Integer guestRegistrationId, Integer rating, boolean external) {
        EventFeedback feedback = new EventFeedback();
        feedback.setGuestRegistrationID(guestRegistrationId);
        feedback.setEventID(99);
        feedback.setOverallRating(rating);
        feedback.setIsIncludedInExternalScore(external);
        return feedback;
    }
}
