package com.fptu.fcms.dto.reporting;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.repository.projection.HistoricalUserView;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record EventReportingDataset(
        Event event,
        List<EventRegistration> registrations,
        List<GuestEventRegistration> guestRegistrations,
        List<AttendanceSession> attendanceSessions,
        List<AttendanceRecord> attendanceRecords,
        List<EventFeedback> feedbacks,
        Map<Integer, HistoricalUserView> usersById,
        LocalDateTime capturedAt
) {}
