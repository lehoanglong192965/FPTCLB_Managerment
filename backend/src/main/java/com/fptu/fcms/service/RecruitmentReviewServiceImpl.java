package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ApplicationReviewRequest;
import com.fptu.fcms.dto.request.InterviewGradingRequest;
import com.fptu.fcms.dto.response.RecruitmentDecisionResponse;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.InterviewSchedule;
import com.fptu.fcms.entity.RecruitmentApplication;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.ClubBlacklistRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.InterviewScheduleRepository;
import com.fptu.fcms.repository.RecruitmentApplicationRepository;
import com.fptu.fcms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RecruitmentReviewServiceImpl implements RecruitmentReviewService {

    private static final String MEMBER_ROLE = "Member";
    private static final String LEADER_ROLE = "Leader";
    private static final int MAX_ACTIVE_CLUBS_PER_STUDENT = 3;
    private static final BigDecimal PASSING_THRESHOLD = BigDecimal.valueOf(5.0);
    private static final String APPLICATION_TABLE = "RecruitmentApplication";
    private static final String MEMBERSHIP_TABLE = "ClubMembership";

    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String STATUS_PASSED = "PASSED";
    private static final String STATUS_FAILED = "FAILED";

    private final RecruitmentApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ClubMembershipRepository memberRepository;
    private final ClubBlacklistRepository blacklistRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final InterviewScheduleRepository interviewScheduleRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public RecruitmentDecisionResponse reviewApplication(
            ApplicationReviewRequest request,
            Integer actorID
    ) {
        Integer applicationID = toIntegerId(request.getApplicationId());
        RecruitmentApplication application = findApplicationForUpdate(applicationID);
        validateLeaderCanManageApplication(actorID, application);
        UserAccount student = findStudent(application.getUserID());
        String oldStatus = application.getStatus();

        if (Boolean.TRUE.equals(request.getIsAccepted())) {
            application.setStatus(STATUS_ACCEPTED);
            RecruitmentApplication savedApplication = applicationRepository.save(application);

            InterviewSchedule schedule = upsertInterviewSchedule(
                    savedApplication.getApplicationID(),
                    request.getInterviewTime(),
                    request.getInterviewLocation()
            );

            writeAuditLog(
                    actorID,
                    "APPLICATION_ACCEPTED",
                    APPLICATION_TABLE,
                    savedApplication.getApplicationID(),
                    "status=" + oldStatus,
                    "status=" + STATUS_ACCEPTED,
                    "BR-R05 application review accepted"
            );

            sendAfterCommit(() -> emailService.sendApplicationAcceptedEmail(
                    student.getEmail(),
                    student.getFullName(),
                    request.getInterviewTime(),
                    request.getInterviewLocation()
            ));

            return buildResponse(savedApplication, student, schedule);
        }

        application.setStatus(STATUS_REJECTED);
        RecruitmentApplication savedApplication = applicationRepository.save(application);

        writeAuditLog(
                actorID,
                "APPLICATION_REJECTED",
                APPLICATION_TABLE,
                savedApplication.getApplicationID(),
                "status=" + oldStatus,
                "status=" + STATUS_REJECTED,
                "BR-R05 application review rejected"
        );

        sendAfterCommit(() -> emailService.sendApplicationRejectedEmail(student.getEmail()));

        return buildResponse(savedApplication, student, null);
    }

    @Override
    @Transactional
    public RecruitmentDecisionResponse gradeInterview(
            InterviewGradingRequest request,
            Integer actorID
    ) {
        Integer applicationID = toIntegerId(request.getApplicationId());
        RecruitmentApplication application = findApplicationForUpdate(applicationID);
        validateLeaderCanManageApplication(actorID, application);
        UserAccount student = findStudent(application.getUserID());
        String oldStatus = application.getStatus();

        BigDecimal interviewScore = BigDecimal.valueOf(request.getInterviewScore());
        application.setInterviewScore(interviewScore);

        boolean passed = interviewScore.compareTo(PASSING_THRESHOLD) >= 0;
        application.setStatus(passed ? STATUS_PASSED : STATUS_FAILED);
        RecruitmentApplication savedApplication = applicationRepository.save(application);

        InterviewSchedule schedule = completeInterviewSchedule(
                savedApplication.getApplicationID(),
                passed ? "Passed" : "Failed"
        );

        if (passed) {
            validateMembershipEligibility(application, student);
            ClubMembership membership = createMember(savedApplication);

            writeAuditLog(
                    actorID,
                    "INTERVIEW_PASSED",
                    APPLICATION_TABLE,
                    savedApplication.getApplicationID(),
                    "status=" + oldStatus,
                    "status=" + STATUS_PASSED,
                    "Interview passed; membershipID=" + membership.getMembershipID()
            );

            writeAuditLog(
                    actorID,
                    "CREATE_MEMBER_FROM_INTERVIEW",
                    MEMBERSHIP_TABLE,
                    membership.getMembershipID(),
                    null,
                    "userID=" + student.getUserID() + ", clubID=" + savedApplication.getClubID(),
                    "Automatic membership creation after passed interview"
            );

            sendAfterCommit(() -> emailService.sendInterviewPassedEmail(student.getEmail()));
        } else {
            writeAuditLog(
                    actorID,
                    "INTERVIEW_FAILED",
                    APPLICATION_TABLE,
                    savedApplication.getApplicationID(),
                    "status=" + oldStatus,
                    "status=" + STATUS_FAILED,
                    "Interview failed"
            );

            sendAfterCommit(() -> emailService.sendInterviewFailedEmail(student.getEmail()));
        }

        return buildResponse(savedApplication, student, schedule);
    }

    private RecruitmentApplication findApplicationForUpdate(Integer applicationID) {
        return applicationRepository.findByIdForUpdate(applicationID)
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy đơn ứng tuyển.",
                        HttpStatus.NOT_FOUND
                ));
    }

    private UserAccount findStudent(Integer userID) {
        return userRepository.findByUserIDAndIsDeletedFalse(userID)
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy sinh viên của đơn ứng tuyển.",
                        HttpStatus.NOT_FOUND
                ));
    }

    private String requireStudentId(UserAccount student) {
        if (!StringUtils.hasText(student.getStudentId())) {
            throw new BusinessRuleException("Không tìm thấy mã sinh viên để kiểm tra điều kiện thành viên.");
        }
        return student.getStudentId();
    }

    private void validateLeaderCanManageApplication(
            Integer actorID,
            RecruitmentApplication application
    ) {
        ClubRole leaderRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse(LEADER_ROLE)
                .orElseThrow(() -> new BusinessRuleException(
                        "Vai trò Leader chưa được cấu hình trong hệ thống.",
                        HttpStatus.CONFLICT
                ));

        boolean isLeaderOfApplicationClub =
                memberRepository.existsByClubIDAndUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                        application.getClubID(),
                        actorID,
                        application.getSemesterID(),
                        leaderRole.getClubRoleID()
                );

        if (!isLeaderOfApplicationClub) {
            throw new BusinessRuleException(
                    "Chỉ Leader của CLB nhận đơn mới được duyệt hoặc chấm phỏng vấn đơn ứng tuyển này.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    private void validateMembershipEligibility(
            RecruitmentApplication application,
            UserAccount student
    ) {
        requireStudentId(student);

        if (memberRepository.existsByClubIDAndUserIDAndIsDeletedFalse(
                application.getClubID(),
                student.getUserID()
        )) {
            throw new BusinessRuleException("Sinh viên đã là thành viên CLB.");
        }

        int activeClubCount = memberRepository.countByUserIDAndSemesterIDAndIsDeletedFalse(
                student.getUserID(),
                application.getSemesterID()
        );

        if (activeClubCount >= MAX_ACTIVE_CLUBS_PER_STUDENT) {
            throw new BusinessRuleException("Sinh viên đã đạt giới hạn tối đa 3 CLB.");
        }

        if (blacklistRepository.existsByClubIDAndUserIDAndIsDeletedFalse(
                application.getClubID(),
                student.getUserID()
        )) {
            throw new BusinessRuleException("Sinh viên đang nằm trong blacklist của CLB.");
        }
    }

    private ClubMembership createMember(RecruitmentApplication application) {
        ClubRole memberRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse(MEMBER_ROLE)
                .orElseThrow(() -> new BusinessRuleException(
                        "Vai trò Member chưa được cấu hình trong hệ thống.",
                        HttpStatus.CONFLICT
                ));

        ClubMembership membership = new ClubMembership();
        membership.setClubID(application.getClubID());
        membership.setUserID(application.getUserID());
        membership.setSemesterID(application.getSemesterID());
        membership.setClubRoleID(memberRole.getClubRoleID());
        membership.setJoinedDate(LocalDate.now());
        membership.setIsDeleted(false);

        try {
            return memberRepository.saveAndFlush(membership);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessRuleException("Sinh viên đã là thành viên CLB.");
        }
    }

    private InterviewSchedule upsertInterviewSchedule(
            Integer applicationID,
            LocalDateTime interviewTime,
            String interviewLocation
    ) {
        InterviewSchedule schedule = interviewScheduleRepository
                .findTopByApplicationIDAndIsDeletedFalseOrderByCreatedAtDesc(applicationID)
                .orElseGet(InterviewSchedule::new);

        schedule.setApplicationID(applicationID);
        schedule.setScheduledTime(interviewTime);
        schedule.setLocation(interviewLocation);
        schedule.setStatus("Scheduled");
        schedule.setResult(null);
        schedule.setCreatedAt(schedule.getCreatedAt() != null ? schedule.getCreatedAt() : LocalDateTime.now());
        schedule.setIsDeleted(false);

        return interviewScheduleRepository.save(schedule);
    }

    private InterviewSchedule completeInterviewSchedule(Integer applicationID, String result) {
        return interviewScheduleRepository
                .findTopByApplicationIDAndIsDeletedFalseOrderByCreatedAtDesc(applicationID)
                .map(schedule -> {
                    schedule.setStatus("Completed");
                    schedule.setResult(result);
                    return interviewScheduleRepository.save(schedule);
                })
                .orElse(null);
    }

    private void writeAuditLog(
            Integer actorID,
            String actionType,
            String tableName,
            Integer recordID,
            String oldValue,
            String newValue,
            String reason
    ) {
        AuditLog log = new AuditLog();
        log.setActorID(actorID);
        log.setActionType(actionType);
        log.setTableName(tableName);
        log.setRecordID(recordID);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setOverrideReason(reason);
        log.setExecutedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }

    private RecruitmentDecisionResponse buildResponse(
            RecruitmentApplication application,
            UserAccount student,
            InterviewSchedule schedule
    ) {
        return RecruitmentDecisionResponse.builder()
                .applicationID(application.getApplicationID())
                .clubID(application.getClubID())
                .userID(application.getUserID())
                .semesterID(application.getSemesterID())
                .studentName(student.getFullName())
                .studentEmail(student.getEmail())
                .status(application.getStatus())
                .interviewScore(application.getInterviewScore())
                .interviewTime(schedule != null ? schedule.getScheduledTime() : null)
                .interviewLocation(schedule != null ? schedule.getLocation() : null)
                .build();
    }

    private Integer toIntegerId(Long value) {
        try {
            return Math.toIntExact(value);
        } catch (ArithmeticException ex) {
            throw new BusinessRuleException("applicationId is out of supported range.");
        }
    }

    private void sendAfterCommit(Runnable emailAction) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            emailAction.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailAction.run();
            }
        });
    }
}
