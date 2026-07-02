package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.SemesterDTO;
import com.fptu.fcms.dto.request.ForceCloseSemesterRequest;
import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.dto.response.SemesterCloseResponse;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.MemberRankingSnapshot;
import com.fptu.fcms.entity.Notification;
import com.fptu.fcms.entity.NotificationRecipient;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.exception.SemesterClosureBlockedException;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.MemberRankingSnapshotRepository;
import com.fptu.fcms.repository.NotificationRecipientRepository;
import com.fptu.fcms.repository.NotificationRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.MemberRankingService;
import com.fptu.fcms.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SemesterServiceImpl implements SemesterService {

    private static final List<EventStatus> FINISHED_EVENT_STATUSES = List.of(
            EventStatus.COMPLETED,
            EventStatus.CANCELLED,
            EventStatus.REJECTED
    );
    private static final String FORCE_CLOSE_ACTION = "FORCE_CLOSE_SEMESTER";
    private static final String SYSTEM_ROLE_ADMIN = "Admin";
    private static final String SYSTEM_ROLE_ICPDP = "ICPDP";
    private static final String NOTIFICATION_TYPE_SEMESTER_BLOCKER_WARNING = "SEMESTER_BLOCKER_WARNING";
    private static final String NOTIFICATION_TYPE_AUTO_CLOSE_BLOCKED = "SEMESTER_AUTO_CLOSE_BLOCKED";
    private static final String NOTIFICATION_TYPE_AUTO_CLOSED = "SEMESTER_AUTO_CLOSED";
    private static final String NOTIFICATION_TYPE_FORCE_CLOSED = "SEMESTER_FORCE_CLOSED";
    private static final String NOTIFICATION_TYPE_RANKING_REWARD = "SEMESTER_RANKING_REWARD";

    private final SemesterRepository semesterRepository;
    private final ClubRepository clubRepository;
    private final EventRepository eventRepository;
    private final MemberRankingSnapshotRepository rankingSnapshotRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final AuditLogRepository auditLogRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final MemberRankingService memberRankingService;

    @Override
    public List<SemesterDTO> getAllSemesters() {
        return semesterRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public SemesterDTO getSemesterById(Integer id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new BusinessRuleException("Semester not found", HttpStatus.NOT_FOUND));
        return mapToDTO(semester);
    }

    @Override
    @Transactional
    public SemesterDTO createSemester(SemesterDTO dto) {
        validateDates(dto.getStartDate(), dto.getEndDate());
        
        if (semesterRepository.existsOverlappingSemester(dto.getStartDate(), dto.getEndDate(), null)) {
            throw new BusinessRuleException("New semester dates overlap with an existing semester");
        }

        Semester semester = new Semester();
        semester.setSemesterCode(dto.getSemesterCode());
        semester.setStartDate(dto.getStartDate());
        semester.setEndDate(dto.getEndDate());
        semester.setIsDeleted(false);
        
        boolean isActivating = dto.getIsActive() != null && dto.getIsActive();
        semester.setIsActive(isActivating);
        
        if (isActivating) {
            deactivateOtherSemesters();
            semesterRepository.flush();
        }

        semester = semesterRepository.save(semester);
        return mapToDTO(semester);
    }

    @Override
    @Transactional
    public SemesterDTO updateSemester(Integer id, SemesterDTO dto) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new BusinessRuleException("Semester not found", HttpStatus.NOT_FOUND));

        if (semester.getEndDate().isBefore(LocalDate.now()) && 
            (!semester.getStartDate().equals(dto.getStartDate()) || !semester.getEndDate().equals(dto.getEndDate()))) {
            throw new BusinessRuleException("Cannot update dates of a semester that has already ended");
        }

        validateDates(dto.getStartDate(), dto.getEndDate());
        
        if (semesterRepository.existsOverlappingSemester(dto.getStartDate(), dto.getEndDate(), id)) {
            throw new BusinessRuleException("Updated dates overlap with another existing semester");
        }

        semester.setSemesterCode(dto.getSemesterCode());
        semester.setStartDate(dto.getStartDate());
        semester.setEndDate(dto.getEndDate());
        
        boolean isActivating = dto.getIsActive() != null && dto.getIsActive();
        if (isActivating && !Boolean.TRUE.equals(semester.getIsActive())) {
            deactivateOtherSemesters();
            semesterRepository.flush();
        }
        semester.setIsActive(isActivating);

        semester = semesterRepository.save(semester);
        return mapToDTO(semester);
    }

    @Override
    @Transactional
    public void deleteSemester(Integer id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new BusinessRuleException("Semester not found", HttpStatus.NOT_FOUND));
        
        if (Boolean.TRUE.equals(semester.getIsActive())) {
            throw new BusinessRuleException("Cannot delete a semester that is currently active");
        }

        semester.setIsDeleted(true);
        semester.setIsActive(false);
        semesterRepository.save(semester);
    }

    @Override
    @Transactional
    public SemesterCloseResponse closeSemester(Integer semesterId, UserPrincipal currentUser) {
        requireAuthenticatedUser(currentUser);
        Semester semester = getValidOpenSemester(semesterId);
        SemesterClosureValidationResult validationResult = validateSemesterCanClose(semester);

        if (validationResult.hasBlockers()) {
            throw new SemesterClosureBlockedException(
                    semester.getSemesterID(),
                    validationResult.getUnfinishedEventCount(),
                    validationResult.getLockedScoreCount(),
                    validationResult.getBlockers()
            );
        }

        updateSemesterToClosed(semester);
        finalizeSemesterRankingSnapshots(semester);
        return buildResponse(
                true,
                "Đóng học kỳ thành công",
                semester,
                false,
                validationResult,
                null
        );
    }

    @Override
    @Transactional
    public SemesterCloseResponse forceCloseSemester(
            Integer semesterId,
            ForceCloseSemesterRequest request,
            UserPrincipal currentUser
    ) {
        requireAuthenticatedUser(currentUser);
        if (request == null || !StringUtils.hasText(request.getReason())) {
            throw new BusinessRuleException("reason không được để trống.", HttpStatus.BAD_REQUEST);
        }

        Semester semester = getValidOpenSemester(semesterId);
        SemesterClosureValidationResult validationResult = validateSemesterCanClose(semester);
        String oldValue = formatActiveState(semester.getIsActive());

        updateSemesterToClosed(semester);
        createForceCloseAuditLog(
                semester,
                currentUser.getUserId(),
                request.getReason(),
                oldValue,
                formatActiveState(semester.getIsActive()),
                validationResult
        );
        sendForceCloseSuccessInAppNotification(semester, validationResult, request.getReason(), currentUser);

        return buildResponse(
                true,
                "Đã ghi đè và đóng học kỳ thành công",
                semester,
                true,
                validationResult,
                FORCE_CLOSE_ACTION
        );
    }


    @Override
    @Transactional
    public void sendSemesterSettlementWarnings() {
        LocalDate settlementRunDate = LocalDate.now();
        List<Semester> semestersToSettle = semesterRepository.findByEndDateAndIsActiveTrueAndIsDeletedFalse(
                settlementRunDate.plusDays(1)
        );
        if (semestersToSettle.isEmpty()) {
            return;
        }

        List<String> icpdpEmails = findSystemRoleEmails(SYSTEM_ROLE_ICPDP);
        for (Semester semester : semestersToSettle) {
            SemesterClosureValidationResult validationResult = validateSemesterCanClose(semester);
            if (validationResult.hasBlockers()) {
                sendIcpdpSettlementBlockerWarning(semester, validationResult, icpdpEmails);
            }
        }
    }
    @Override
    @Transactional(readOnly = true)
    public void sendSemesterEndDateWarnings() {
        LocalDate today = LocalDate.now();
        List<Semester> endingSemesters = semesterRepository.findByEndDateAndIsActiveTrueAndIsDeletedFalse(today);
        if (endingSemesters.isEmpty()) {
            return;
        }

        List<String> adminEmails = findAdminEmails();
        for (Semester semester : endingSemesters) {
            SemesterClosureValidationResult validationResult = validateSemesterCanClose(semester);
            sendEndDateWarningEmail(semester, validationResult, adminEmails);
        }
    }

    @Override
    @Transactional
    public void autoCloseEndedSemesters() {
        LocalDate today = LocalDate.now();
        List<Semester> endingSemesters = semesterRepository.findByEndDateAndIsActiveTrueAndIsDeletedFalse(today);
        if (endingSemesters.isEmpty()) {
            return;
        }

        List<String> adminEmails = findAdminEmails();
        for (Semester semester : endingSemesters) {
            SemesterClosureValidationResult validationResult = validateSemesterCanClose(semester);
            if (validationResult.hasBlockers()) {
                sendAutoCloseBlockedEmail(semester, validationResult, adminEmails);
                continue;
            }

            updateSemesterToClosed(semester);
            finalizeSemesterRankingSnapshots(semester);
            sendAutoCloseSuccessEmail(semester, adminEmails);
        }
    }

    private Semester getValidOpenSemester(Integer semesterId) {
        Semester semester = semesterRepository.findBySemesterIDAndIsDeletedFalse(semesterId)
                .orElseThrow(() -> new BusinessRuleException("Semester not found", HttpStatus.NOT_FOUND));

        if (!Boolean.TRUE.equals(semester.getIsActive())) {
            throw new BusinessRuleException("Semester is already closed", HttpStatus.CONFLICT);
        }
        return semester;
    }

    private SemesterClosureValidationResult validateSemesterCanClose(Semester semester) {
        long unfinishedEventCount = eventRepository.countUnfinishedEventsBySemesterId(
                semester.getSemesterID(),
                FINISHED_EVENT_STATUSES
        );
        long lockedScoreCount = eventRepository.countLockedScoreEventsBySemesterId(semester.getSemesterID());

        List<String> blockers = new ArrayList<>();
        if (unfinishedEventCount > 0) {
            blockers.add("Còn " + unfinishedEventCount + " sự kiện chưa hoàn tất");
        }
        if (lockedScoreCount > 0) {
            blockers.add("Có " + lockedScoreCount + " sự kiện đang khóa điểm");
        }

        return new SemesterClosureValidationResult(unfinishedEventCount, lockedScoreCount, blockers);
    }

    private void updateSemesterToClosed(Semester semester) {
        semester.setIsActive(false);
        semesterRepository.save(semester);
    }

    private void createForceCloseAuditLog(
            Semester semester,
            Integer actorId,
            String reason,
            String oldValue,
            String newValue,
            SemesterClosureValidationResult validationResult
    ) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActorID(actorId);
        auditLog.setActionType(FORCE_CLOSE_ACTION);
        auditLog.setTableName("Semester");
        auditLog.setRecordID(semester.getSemesterID());
        auditLog.setOldValue(oldValue);
        auditLog.setNewValue(newValue);
        auditLog.setOverrideReason(buildForceCloseAuditReason(semester, reason, validationResult));
        auditLog.setExecutedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String buildForceCloseAuditReason(
            Semester semester,
            String reason,
            SemesterClosureValidationResult validationResult
    ) {
        String escapedReason = reason.trim().replace("\"", "\\\"");
        String escapedCode = semester.getSemesterCode() == null
                ? ""
                : semester.getSemesterCode().replace("\"", "\\\"");
        String blockers = validationResult.getBlockers().stream()
                .map(blocker -> "\"" + blocker.replace("\"", "\\\"") + "\"")
                .collect(Collectors.joining(","));

        return "{"
                + "\"reason\":\"" + escapedReason + "\","
                + "\"semesterCode\":\"" + escapedCode + "\","
                + "\"unfinishedEventCount\":" + validationResult.getUnfinishedEventCount() + ","
                + "\"lockedScoreCount\":" + validationResult.getLockedScoreCount() + ","
                + "\"blockers\":[" + blockers + "]"
                + "}";
    }

    private SemesterCloseResponse buildResponse(
            boolean success,
            String message,
            Semester semester,
            boolean forced,
            SemesterClosureValidationResult validationResult,
            String auditAction
    ) {
        return new SemesterCloseResponse(
                success,
                message,
                semester.getSemesterID(),
                semester.getSemesterCode(),
                resolveSemesterStatus(semester),
                forced,
                validationResult.getUnfinishedEventCount(),
                validationResult.getLockedScoreCount(),
                validationResult.getBlockers(),
                auditAction
        );
    }

    private List<String> findAdminEmails() {
        return findSystemRoleEmails(SYSTEM_ROLE_ADMIN);
    }


    private List<UserAccount> findSystemRoleUsers(String roleName) {
        return systemRoleRepository.findByRoleName(roleName)
                .map(SystemRole::getRoleID)
                .map(userRepository::findByRoleIDAndIsDeletedFalse)
                .orElse(List.of());
    }
    private List<String> findSystemRoleEmails(String roleName) {
        return findSystemRoleUsers(roleName)
                .stream()
                .map(UserAccount::getEmail)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }


    private void sendIcpdpSettlementBlockerWarning(
            Semester semester,
            SemesterClosureValidationResult validationResult,
            List<String> icpdpEmails
    ) {
        String subject = "Yêu cầu xử lý blocker trước kết toán học kỳ: " + semester.getSemesterCode();
        String content = "Học kỳ " + semester.getSemesterCode() + " sẽ kết toán hôm nay ("
                + semester.getEndDate().minusDays(1) + ") và kết thúc vào " + semester.getEndDate() + ".\n"
                + "ICPDP cần xử lý xong các event Pending/Approved, điểm khóa và blocker trước khi hệ thống tổng hợp ranking.\n"
                + "Số sự kiện chưa hoàn tất: " + validationResult.getUnfinishedEventCount() + "\n"
                + "Số sự kiện đang khóa điểm: " + validationResult.getLockedScoreCount() + "\n"
                + "Chi tiết: " + (validationResult.hasBlockers()
                        ? String.join("; ", validationResult.getBlockers())
                        : "Không có blocker tại thời điểm kiểm tra.");
        sendEmails(icpdpEmails, subject, content);
        sendInAppSystemNotificationToRole(
                SYSTEM_ROLE_ICPDP,
                subject,
                NOTIFICATION_TYPE_SEMESTER_BLOCKER_WARNING,
                content
        );
    }


    private void sendInAppSystemNotificationToRole(
            String roleName,
            String title,
            String notificationType,
            String content
    ) {
        sendInAppSystemNotification(findSystemRoleUsers(roleName), title, notificationType, content);
    }

    private void sendInAppSystemNotification(
            List<UserAccount> recipients,
            String title,
            String notificationType,
            String content
    ) {
        sendInAppNotification(recipients, null, title, notificationType, content);
    }

    private void sendInAppClubNotification(
            List<UserAccount> recipients,
            Club club,
            String title,
            String notificationType,
            String content
    ) {
        sendInAppNotification(recipients, club, title, notificationType, content);
    }

    private void sendInAppNotification(
            List<UserAccount> recipients,
            Club club,
            String title,
            String notificationType,
            String content
    ) {
        if (recipients.isEmpty()) {
            return;
        }

        UserAccount creator = findSystemNotificationCreator(recipients);
        LocalDateTime now = LocalDateTime.now();
        Notification notification = new Notification();
        notification.setClub(club);
        notification.setCreatedBy(creator);
        notification.setTitle(title);
        notification.setNotificationType(notificationType);
        notification.setContent(content);
        notification.setCreatedAt(now);
        notification.setIsDeleted(false);

        Notification savedNotification = notificationRepository.save(notification);
        List<NotificationRecipient> notificationRecipients = recipients.stream()
                .distinct()
                .map(user -> createNotificationRecipient(savedNotification, user, now))
                .toList();
        notificationRecipientRepository.saveAll(notificationRecipients);
    }

    private NotificationRecipient createNotificationRecipient(
            Notification notification,
            UserAccount user,
            LocalDateTime createdAt
    ) {
        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setNotification(notification);
        recipient.setUser(user);
        recipient.setIsRead(false);
        recipient.setReadAt(null);
        recipient.setCreatedAt(createdAt);
        return recipient;
    }

    private UserAccount findSystemNotificationCreator(List<UserAccount> fallbackUsers) {
        return findSystemRoleUsers(SYSTEM_ROLE_ADMIN)
                .stream()
                .findFirst()
                .orElse(fallbackUsers.get(0));
    }
    private void finalizeSemesterRankingSnapshots(Semester semester) {
        List<Club> activeClubs = clubRepository.findByClubStatusAndIsDeletedFalse("Active");
        for (Club club : activeClubs) {
            finalizeClubRankingSnapshot(semester, club);
        }
    }

    private List<MemberRankingSnapshot> finalizeClubRankingSnapshot(Semester semester, Club club) {
        rankingSnapshotRepository.softDeleteActiveSnapshots(semester.getSemesterID(), club.getClubID());
        List<MemberRankingDTO> rankings = memberRankingService.getMemberRankings(club.getClubID());
        LocalDateTime finalizedAt = LocalDateTime.now();
        List<MemberRankingSnapshot> snapshots = rankings.stream()
                .map(ranking -> mapToSnapshot(semester, club, ranking, finalizedAt))
                .toList();
        rankingSnapshotRepository.saveAll(snapshots);

        List<MemberRankingSnapshot> finalizedSnapshots = rankingSnapshotRepository
                .findBySemesterIDAndClubIDAndIsDeletedFalseOrderByRankAscUserIDAsc(
                        semester.getSemesterID(),
                        club.getClubID()
                );
        sendTopRankingRewardNotifications(semester, club, finalizedSnapshots);
        return finalizedSnapshots;
    }

    private void sendTopRankingRewardNotifications(
            Semester semester,
            Club club,
            List<MemberRankingSnapshot> finalizedSnapshots
    ) {
        finalizedSnapshots.stream()
                .filter(snapshot -> snapshot.getRank() != null && snapshot.getRank() <= 3)
                .limit(3)
                .forEach(snapshot -> sendTopRankingRewardNotification(semester, club, snapshot));
    }

    private void sendTopRankingRewardNotification(Semester semester, Club club, MemberRankingSnapshot snapshot) {
        String subject = "Chúc mừng Top " + snapshot.getRank() + " BXH CLB " + club.getClubName();
        String content = buildTopRankingRewardContent(semester, club, snapshot);
        resolveSnapshotEmail(snapshot)
                .ifPresent(email -> emailService.sendSimpleEmail(email, subject, content));
        userRepository.findByUserIDAndIsDeletedFalse(snapshot.getUserID())
                .ifPresent(user -> sendInAppClubNotification(
                        List.of(user),
                        club,
                        subject,
                        NOTIFICATION_TYPE_RANKING_REWARD,
                        content
                ));
    }

    private java.util.Optional<String> resolveSnapshotEmail(MemberRankingSnapshot snapshot) {
        if (StringUtils.hasText(snapshot.getEmail())) {
            return java.util.Optional.of(snapshot.getEmail());
        }
        return userRepository.findByUserIDAndIsDeletedFalse(snapshot.getUserID())
                .map(UserAccount::getEmail)
                .filter(StringUtils::hasText);
    }

    private String buildTopRankingRewardContent(Semester semester, Club club, MemberRankingSnapshot snapshot) {
        String memberName = StringUtils.hasText(snapshot.getFullName()) ? snapshot.getFullName() : "Thành viên";
        return "Chúc mừng " + memberName + " đã đạt Top " + snapshot.getRank()
                + " trong BXH thành viên CLB " + club.getClubName()
                + " học kỳ " + semester.getSemesterCode() + ".\n"
                + "Tổng điểm: " + snapshot.getTotalScore() + "\n"
                + "Điểm đóng góp: " + snapshot.getContributionPoint() + "\n"
                + "Điểm tham gia sự kiện: " + snapshot.getEventParticipationPoint() + "\n"
                + "Điểm performance: " + snapshot.getPerformancePoint() + "\n"
                + "Vui lòng liên hệ Ban điều hành CLB hoặc Admin/ICPDP để nhận thưởng.";
    }

    private MemberRankingSnapshot mapToSnapshot(
            Semester semester,
            Club club,
            MemberRankingDTO ranking,
            LocalDateTime finalizedAt
    ) {
        MemberRankingSnapshot snapshot = new MemberRankingSnapshot();
        snapshot.setSemesterID(semester.getSemesterID());
        snapshot.setClubID(club.getClubID());
        snapshot.setUserID(ranking.getUserId());
        snapshot.setFullName(ranking.getFullName());
        snapshot.setEmail(ranking.getEmail());
        snapshot.setRank(ranking.getRank());
        snapshot.setTotalScore(ranking.getTotalScore());
        snapshot.setContributionPoint(ranking.getContributionPoint());
        snapshot.setEventParticipationPoint(ranking.getEventParticipationPoint());
        snapshot.setPerformancePoint(ranking.getPerformancePoint());
        snapshot.setFinalizedAt(finalizedAt);
        snapshot.setFinalizedBy(null);
        snapshot.setIsDeleted(false);
        return snapshot;
    }
    private void sendEndDateWarningEmail(
            Semester semester,
            SemesterClosureValidationResult validationResult,
            List<String> adminEmails
    ) {
        String subject = "Cảnh báo học kỳ kết thúc hôm nay: " + semester.getSemesterCode();
        String content = "Học kỳ " + semester.getSemesterCode() + " sẽ kết thúc hôm nay (" + semester.getEndDate() + ").\n"
                + "Hệ thống sẽ tự thử đóng học kỳ vào cuối ngày.\n"
                + buildClosureSummary(validationResult);
        sendEmails(adminEmails, subject, content);
    }

    private void sendAutoCloseBlockedEmail(
            Semester semester,
            SemesterClosureValidationResult validationResult,
            List<String> adminEmails
    ) {
        String subject = "Không thể tự động đóng học kỳ: " + semester.getSemesterCode();
        String content = "Hệ thống không thể tự động đóng học kỳ " + semester.getSemesterCode()
                + " vì còn dữ liệu chưa hoàn tất.\n"
                + buildClosureSummary(validationResult)
                + "\nAdmin vui lòng xử lý dữ liệu tồn đọng hoặc dùng chức năng force-close nếu cần.";
        sendEmails(adminEmails, subject, content);
        sendInAppSystemNotificationToRole(SYSTEM_ROLE_ADMIN, subject, NOTIFICATION_TYPE_AUTO_CLOSE_BLOCKED, content);
    }

    private void sendForceCloseSuccessInAppNotification(
            Semester semester,
            SemesterClosureValidationResult validationResult,
            String reason,
            UserPrincipal currentUser
    ) {
        String title = "Admin đã force-close học kỳ: " + semester.getSemesterCode();
        String content = "Học kỳ " + semester.getSemesterCode()
                + " đã được force-close bởi Admin userID=" + currentUser.getUserId() + ".\n"
                + "Lý do: " + reason.trim() + "\n"
                + buildClosureSummary(validationResult);
        sendInAppSystemNotification(
                findAdminUsersIncludingCurrentUser(currentUser),
                title,
                NOTIFICATION_TYPE_FORCE_CLOSED,
                content
        );
    }

    private List<UserAccount> findAdminUsersIncludingCurrentUser(UserPrincipal currentUser) {
        List<UserAccount> admins = new ArrayList<>(findSystemRoleUsers(SYSTEM_ROLE_ADMIN));
        userRepository.findByUserIDAndIsDeletedFalse(currentUser.getUserId())
                .filter(user -> admins.stream()
                        .noneMatch(admin -> Objects.equals(admin.getUserID(), user.getUserID())))
                .ifPresent(admins::add);
        return admins;
    }

    private void sendAutoCloseSuccessEmail(Semester semester, List<String> adminEmails) {
        String subject = "Đã tự động đóng học kỳ: " + semester.getSemesterCode();
        String content = "Học kỳ " + semester.getSemesterCode() + " đã được hệ thống tự động đóng vào cuối ngày kết thúc.";
        sendEmails(adminEmails, subject, content);
        sendInAppSystemNotificationToRole(SYSTEM_ROLE_ADMIN, subject, NOTIFICATION_TYPE_AUTO_CLOSED, content);
    }

    private String buildClosureSummary(SemesterClosureValidationResult validationResult) {
        if (!validationResult.hasBlockers()) {
            return "Hiện không có sự kiện chưa hoàn tất hoặc điểm đang khóa.";
        }
        return "Số sự kiện chưa hoàn tất: " + validationResult.getUnfinishedEventCount() + "\n"
                + "Số sự kiện đang khóa điểm: " + validationResult.getLockedScoreCount() + "\n"
                + "Chi tiết: " + String.join("; ", validationResult.getBlockers());
    }

    private void sendEmails(List<String> emails, String subject, String content) {
        emails.stream()
                .filter(Objects::nonNull)
                .filter(StringUtils::hasText)
                .distinct()
                .forEach(email -> emailService.sendSimpleEmail(email, subject, content));
    }

    private void requireAuthenticatedUser(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException("Bạn cần đăng nhập để thực hiện thao tác này.", HttpStatus.FORBIDDEN);
        }
    }

    private String resolveSemesterStatus(Semester semester) {
        return Boolean.TRUE.equals(semester.getIsActive()) ? "Active" : "Closed";
    }

    private String formatActiveState(Boolean isActive) {
        return "isActive=" + Boolean.TRUE.equals(isActive);
    }

    private void deactivateOtherSemesters() {
        List<Semester> activeSemesters = semesterRepository.findByIsActiveTrue();
        for (Semester s : activeSemesters) {
            s.setIsActive(false);
            semesterRepository.save(s);
        }
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
    }

    private SemesterDTO mapToDTO(Semester entity) {
        SemesterDTO dto = new SemesterDTO();
        dto.setSemesterID(entity.getSemesterID());
        dto.setSemesterCode(entity.getSemesterCode());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setIsActive(entity.getIsActive());
        dto.setIsDeleted(entity.getIsDeleted());
        return dto;
    }

    private static class SemesterClosureValidationResult {
        private final long unfinishedEventCount;
        private final long lockedScoreCount;
        private final List<String> blockers;

        private SemesterClosureValidationResult(long unfinishedEventCount, long lockedScoreCount, List<String> blockers) {
            this.unfinishedEventCount = unfinishedEventCount;
            this.lockedScoreCount = lockedScoreCount;
            this.blockers = blockers;
        }

        private boolean hasBlockers() {
            return unfinishedEventCount > 0 || lockedScoreCount > 0;
        }

        private long getUnfinishedEventCount() {
            return unfinishedEventCount;
        }

        private long getLockedScoreCount() {
            return lockedScoreCount;
        }

        private List<String> getBlockers() {
            return blockers;
        }
    }
}
