package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.EventReportUploadRequest;
import com.fptu.fcms.dto.response.EventReportResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.EventReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventReportServiceImpl implements EventReportService {

    private static final String SYSTEM_ROLE_ADMIN = "Admin";
    private static final String SYSTEM_ROLE_ICPDP = "ICPDP";
    private static final String CLUB_ROLE_LEADER = "Leader";

    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final UserRepository userRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final ClubMembershipRepository clubMembershipRepository;

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public EventReportResponse uploadReport(
            Integer eventId,
            EventReportUploadRequest request,
            Integer uploadedBy
    ) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy sự kiện.",
                        HttpStatus.NOT_FOUND
                ));
        validateUploadPermission(event, uploadedBy);

        EventReport report = new EventReport();
        report.setEventID(event.getEventID());
        report.setReportUrl(request.getReportUrl());
        report.setSummary(request.getSummary());
        report.setUploadedBy(uploadedBy);
        report.setUploadedAt(LocalDateTime.now());
        report.setIsDeleted(false);

        EventReport saved = eventReportRepository.save(report);
        return new EventReportResponse(
                saved.getReportID(),
                saved.getEventID(),
                saved.getReportUrl(),
                saved.getSummary(),
                saved.getUploadedBy(),
                saved.getUploadedAt()
        );
    }

    private void validateUploadPermission(Event event, Integer uploadedBy) {
        UserAccount user = userRepository.findByUserIDAndIsDeletedFalse(uploadedBy)
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy tài khoản upload báo cáo.",
                        HttpStatus.NOT_FOUND
                ));

        SystemRole systemRole = systemRoleRepository.findById(user.getRoleID()).orElse(null);
        if (systemRole != null &&
                (SYSTEM_ROLE_ADMIN.equals(systemRole.getRoleName()) || SYSTEM_ROLE_ICPDP.equals(systemRole.getRoleName()))) {
            return;
        }

        Integer leaderRoleID = clubRoleRepository.findByRoleNameAndIsDeletedFalse(CLUB_ROLE_LEADER)
                .orElseThrow(() -> new BusinessRuleException(
                        "Vai trò Leader chưa được cấu hình trong hệ thống.",
                        HttpStatus.CONFLICT
                ))
                .getClubRoleID();

        boolean isEventClubLeader = clubMembershipRepository
                .existsByClubIDAndUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                        event.getClubID(),
                        uploadedBy,
                        event.getSemesterID(),
                        leaderRoleID
                );

        if (!isEventClubLeader) {
            throw new BusinessRuleException(
                    "Chỉ Leader của CLB tổ chức sự kiện hoặc Admin/ICPDP được upload báo cáo sự kiện này.",
                    HttpStatus.FORBIDDEN
            );
        }
    }
}
