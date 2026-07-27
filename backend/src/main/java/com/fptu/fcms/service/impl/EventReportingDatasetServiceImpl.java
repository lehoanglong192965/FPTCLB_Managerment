package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventFeedbackRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.repository.projection.HistoricalUserView;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventReportingDatasetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ nạp bộ dữ liệu thô (dataset) của sự kiện từ CSDL.
 * Layer: Service Implementation.
 * Trách nhiệm chính: Thực hiện truy vấn CSDL 1 lần duy nhất để nạp đầy đủ thông tin sự kiện, danh sách đăng ký SV/Khách, phiên & bản ghi điểm danh, đánh giá feedback và map thông tin lịch sử người dùng.
 * Phụ thuộc trong luồng báo cáo tự động: Được gọi đầu tiên bởi AutomaticEventReportServiceImpl. Bộ dữ liệu nạp ra (EventReportingDataset) sẽ được dùng chung cho cả EventReportCalculationService (tính snapshot) và EventExportService (xuất CSV) nhằm tối ưu hiệu năng và tránh n+1 query.
 */
@Service
@RequiredArgsConstructor
public class EventReportingDatasetServiceImpl implements EventReportingDatasetService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventFeedbackRepository eventFeedbackRepository;
    private final UserRepository userRepository;
    private final EventAssignmentAccessService eventAssignmentAccessService;

    @Override
    @Transactional(readOnly = true)
    public EventReportingDataset loadDataset(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);

        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));

        List<EventRegistration> registrations =
                eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        List<GuestEventRegistration> guestRegistrations =
                guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        List<AttendanceSession> attendanceSessions =
                attendanceSessionRepository.findByEventIDAndIsDeletedFalseOrderByCheckInTimeAsc(eventId);

        List<Integer> sessionIds = attendanceSessions.stream()
                .filter(s -> s.getSessionID() != null)
                .map(AttendanceSession::getSessionID)
                .toList();

        List<AttendanceRecord> attendanceRecords = sessionIds.isEmpty()
                ? List.of()
                : attendanceRecordRepository.findBySessionIDInAndIsDeletedFalse(sessionIds);

        List<EventFeedback> feedbacks =
                eventFeedbackRepository.findByEventIDAndIsDeletedFalse(eventId);

        Set<Integer> userIds = new LinkedHashSet<>();
        for (EventRegistration r : registrations) {
            if (r.getUserID() != null) userIds.add(r.getUserID());
            if (r.getPurchaserUserID() != null) userIds.add(r.getPurchaserUserID());
        }
        for (AttendanceRecord ar : attendanceRecords) {
            if (ar.getUserID() != null) userIds.add(ar.getUserID());
            if (ar.getCheckedInBy() != null) userIds.add(ar.getCheckedInBy());
        }

        Map<Integer, HistoricalUserView> usersById = userIds.isEmpty()
                ? Map.of()
                : userRepository.findHistoricalUsersByIds(userIds).stream()
                .filter(u -> u.getUserId() != null)
                .collect(Collectors.toMap(HistoricalUserView::getUserId, Function.identity(), (a, b) -> a));

        return new EventReportingDataset(
                event,
                registrations,
                guestRegistrations,
                attendanceSessions,
                attendanceRecords,
                feedbacks,
                usersById,
                LocalDateTime.now()
        );
    }
}
