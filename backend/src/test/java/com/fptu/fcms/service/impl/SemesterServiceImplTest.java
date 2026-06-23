package com.fptu.fcms.service.impl;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SemesterServiceImplTest {

    @Mock
    private SemesterRepository semesterRepository;

    @Mock
    private ClubRepository clubRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private MemberRankingSnapshotRepository rankingSnapshotRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationRecipientRepository notificationRecipientRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private SystemRoleRepository systemRoleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private MemberRankingService memberRankingService;

    private SemesterServiceImpl semesterService;
    private UserPrincipal adminUser;

    @BeforeEach
    void setUp() {
        semesterService = new SemesterServiceImpl(
                semesterRepository,
                clubRepository,
                eventRepository,
                rankingSnapshotRepository,
                notificationRepository,
                notificationRecipientRepository,
                auditLogRepository,
                systemRoleRepository,
                userRepository,
                emailService,
                memberRankingService
        );
        adminUser = new UserPrincipal(99, "admin@fpt.edu.vn", 1, List.of());
    }

    @Test
    void closeSemester_setsActiveFalseWhenNoBlockers() {
        Semester semester = activeSemester();
        mockOpenSemester(semester);
        mockClosureCounts(0L, 0L);
        when(semesterRepository.save(any(Semester.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SemesterCloseResponse result = semesterService.closeSemester(1, adminUser);

        assertTrue(result.isSuccess());
        assertEquals("Đóng học kỳ thành công", result.getMessage());
        assertEquals("Closed", result.getSemesterStatus());
        assertFalse(result.isForced());
        assertFalse(semester.getIsActive());
        verify(semesterRepository).save(semester);
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void closeSemester_blocksWhenSemesterHasIncompleteEvents() {
        Semester semester = activeSemester();
        mockOpenSemester(semester);
        mockClosureCounts(2L, 0L);

        SemesterClosureBlockedException exception = assertThrows(
                SemesterClosureBlockedException.class,
                () -> semesterService.closeSemester(1, adminUser)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(2L, exception.getUnfinishedEventCount());
        assertEquals(0L, exception.getLockedScoreCount());
        assertEquals(List.of("Còn 2 sự kiện chưa hoàn tất"), exception.getBlockers());
        verify(semesterRepository, never()).save(any(Semester.class));
    }

    @Test
    void closeSemester_blocksWhenSemesterHasLockedScores() {
        Semester semester = activeSemester();
        mockOpenSemester(semester);
        mockClosureCounts(0L, 3L);

        SemesterClosureBlockedException exception = assertThrows(
                SemesterClosureBlockedException.class,
                () -> semesterService.closeSemester(1, adminUser)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(0L, exception.getUnfinishedEventCount());
        assertEquals(3L, exception.getLockedScoreCount());
        assertEquals(List.of("Có 3 sự kiện đang khóa điểm"), exception.getBlockers());
        verify(semesterRepository, never()).save(any(Semester.class));
    }

    @Test
    void forceCloseSemester_closesAndWritesAuditLogEvenWithBlockers() {
        Semester semester = activeSemester();
        ForceCloseSemesterRequest request = forceRequest();
        mockOpenSemester(semester);
        mockClosureCounts(2L, 3L);
        when(semesterRepository.save(any(Semester.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SemesterCloseResponse result = semesterService.forceCloseSemester(1, request, adminUser);

        assertTrue(result.isSuccess());
        assertTrue(result.isForced());
        assertEquals("FORCE_CLOSE_SEMESTER", result.getAuditAction());
        assertEquals(2L, result.getUnfinishedEventCount());
        assertEquals(3L, result.getLockedScoreCount());
        assertFalse(semester.getIsActive());

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        AuditLog auditLog = auditCaptor.getValue();
        assertEquals(99, auditLog.getActorID());
        assertEquals("FORCE_CLOSE_SEMESTER", auditLog.getActionType());
        assertEquals("Semester", auditLog.getTableName());
        assertEquals(1, auditLog.getRecordID());
        assertEquals("isActive=true", auditLog.getOldValue());
        assertEquals("isActive=false", auditLog.getNewValue());
        assertTrue(auditLog.getOverrideReason().contains("Kết thúc học kỳ theo quyết định khẩn cấp"));
        assertTrue(auditLog.getOverrideReason().contains("\"unfinishedEventCount\":2"));
        assertTrue(auditLog.getOverrideReason().contains("\"lockedScoreCount\":3"));
        assertTrue(auditLog.getExecutedAt() != null);
    }

    @Test
    void forceCloseSemester_propagatesAuditFailureForTransactionRollback() {
        Semester semester = activeSemester();
        mockOpenSemester(semester);
        mockClosureCounts(1L, 1L);
        when(semesterRepository.save(any(Semester.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("audit failed"));

        assertThrows(
                RuntimeException.class,
                () -> semesterService.forceCloseSemester(1, forceRequest(), adminUser)
        );

        verify(semesterRepository).save(semester);
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void sendSemesterSettlementWarnings_sendsEmailAndInAppNotificationToIcpdpWhenBlockersExist() {
        Semester semester = activeSemester();
        semester.setEndDate(LocalDate.now().plusDays(1));
        mockClosureCounts(2L, 1L);
        when(semesterRepository.findByEndDateAndIsActiveTrueAndIsDeletedFalse(LocalDate.now().plusDays(1)))
                .thenReturn(List.of(semester));

        SystemRole icpdpRole = systemRole(3, "ICPDP");
        UserAccount icpdpUser = user(11, 3, "icpdp@fpt.edu.vn", "ICPDP User");
        when(systemRoleRepository.findByRoleName("ICPDP")).thenReturn(Optional.of(icpdpRole));
        when(systemRoleRepository.findByRoleName("Admin")).thenReturn(Optional.empty());
        when(userRepository.findByRoleIDAndIsDeletedFalse(3)).thenReturn(List.of(icpdpUser));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        semesterService.sendSemesterSettlementWarnings();

        verify(emailService).sendSimpleEmail(eq("icpdp@fpt.edu.vn"), anyString(), anyString());
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification notification = notificationCaptor.getValue();
        assertEquals("SEMESTER_BLOCKER_WARNING", notification.getNotificationType());
        assertEquals(icpdpUser, notification.getCreatedBy());
        assertTrue(notification.getContent().contains("Số sự kiện chưa hoàn tất: 2"));
        assertTrue(notification.getContent().contains("Số sự kiện đang khóa điểm: 1"));

        ArgumentCaptor<List<NotificationRecipient>> recipientsCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRecipientRepository).saveAll(recipientsCaptor.capture());
        List<NotificationRecipient> recipients = recipientsCaptor.getValue();
        assertEquals(1, recipients.size());
        assertEquals(icpdpUser, recipients.get(0).getUser());
        assertFalse(recipients.get(0).getIsRead());
    }

    @Test
    void closeSemester_finalizesRankingAndNotifiesTopThreeMembersAfterSuccessfulClose() {
        Semester semester = activeSemester();
        Club club = club(10, "FPT Club");
        UserAccount top1 = user(101, 4, "top1@fpt.edu.vn", "Top One");
        UserAccount top2 = user(102, 4, "top2@fpt.edu.vn", "Top Two");
        UserAccount top3 = user(103, 4, "top3@fpt.edu.vn", "Top Three");
        mockOpenSemester(semester);
        mockClosureCounts(0L, 0L);
        when(semesterRepository.save(any(Semester.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(clubRepository.findByClubStatusAndIsDeletedFalse("Active")).thenReturn(List.of(club));
        when(memberRankingService.getMemberRankings(10)).thenReturn(List.of(
                ranking(1, top1),
                ranking(2, top2),
                ranking(3, top3)
        ));
        List<MemberRankingSnapshot> snapshots = List.of(
                snapshot(1, top1, club),
                snapshot(2, top2, club),
                snapshot(3, top3, club)
        );
        when(rankingSnapshotRepository.findBySemesterIDAndClubIDAndIsDeletedFalseOrderByRankAscUserIDAsc(1, 10))
                .thenReturn(snapshots);
        when(userRepository.findByUserIDAndIsDeletedFalse(101)).thenReturn(Optional.of(top1));
        when(userRepository.findByUserIDAndIsDeletedFalse(102)).thenReturn(Optional.of(top2));
        when(userRepository.findByUserIDAndIsDeletedFalse(103)).thenReturn(Optional.of(top3));
        when(systemRoleRepository.findByRoleName("Admin")).thenReturn(Optional.empty());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        semesterService.closeSemester(1, adminUser);

        verify(semesterRepository).save(semester);
        verify(rankingSnapshotRepository).softDeleteActiveSnapshots(1, 10);
        verify(rankingSnapshotRepository).saveAll(any());
        verify(emailService).sendSimpleEmail(eq("top1@fpt.edu.vn"), anyString(), anyString());
        verify(emailService).sendSimpleEmail(eq("top2@fpt.edu.vn"), anyString(), anyString());
        verify(emailService).sendSimpleEmail(eq("top3@fpt.edu.vn"), anyString(), anyString());
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(3)).save(notificationCaptor.capture());
        List<Notification> notifications = notificationCaptor.getAllValues();
        assertTrue(notifications.stream()
                .allMatch(notification -> "SEMESTER_RANKING_REWARD".equals(notification.getNotificationType())));
        assertTrue(notifications.stream().allMatch(notification -> club.equals(notification.getClub())));
        verify(notificationRecipientRepository, times(3)).saveAll(any());
        assertFalse(semester.getIsActive());
    }


    @Test
    void autoCloseEndedSemesters_sendsEmailAndInAppNotificationToAdminsWhenBlocked() {
        Semester semester = activeSemester();
        semester.setEndDate(LocalDate.now());
        mockClosureCounts(2L, 1L);
        when(semesterRepository.findByEndDateAndIsActiveTrueAndIsDeletedFalse(LocalDate.now()))
                .thenReturn(List.of(semester));

        SystemRole adminRole = systemRole(1, "Admin");
        UserAccount admin = user(99, 1, "admin@fpt.edu.vn", "Admin User");
        when(systemRoleRepository.findByRoleName("Admin")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByRoleIDAndIsDeletedFalse(1)).thenReturn(List.of(admin));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        semesterService.autoCloseEndedSemesters();

        verify(emailService).sendSimpleEmail(eq("admin@fpt.edu.vn"), anyString(), anyString());
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification notification = notificationCaptor.getValue();
        assertEquals("SEMESTER_AUTO_CLOSE_BLOCKED", notification.getNotificationType());
        assertEquals(admin, notification.getCreatedBy());
        assertTrue(notification.getContent().contains("Số sự kiện chưa hoàn tất: 2"));
        assertTrue(notification.getContent().contains("Số sự kiện đang khóa điểm: 1"));

        ArgumentCaptor<List<NotificationRecipient>> recipientsCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRecipientRepository).saveAll(recipientsCaptor.capture());
        List<NotificationRecipient> recipients = recipientsCaptor.getValue();
        assertEquals(1, recipients.size());
        assertEquals(admin, recipients.get(0).getUser());
        assertTrue(semester.getIsActive());
    }

    @Test
    void autoCloseEndedSemesters_sendsEmailAndInAppNotificationToAdminsWhenSuccessful() {
        Semester semester = activeSemester();
        semester.setEndDate(LocalDate.now());
        mockClosureCounts(0L, 0L);
        when(semesterRepository.findByEndDateAndIsActiveTrueAndIsDeletedFalse(LocalDate.now()))
                .thenReturn(List.of(semester));
        when(semesterRepository.save(any(Semester.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SystemRole adminRole = systemRole(1, "Admin");
        UserAccount admin = user(99, 1, "admin@fpt.edu.vn", "Admin User");
        when(systemRoleRepository.findByRoleName("Admin")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByRoleIDAndIsDeletedFalse(1)).thenReturn(List.of(admin));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        semesterService.autoCloseEndedSemesters();

        verify(semesterRepository).save(semester);
        verify(emailService).sendSimpleEmail(eq("admin@fpt.edu.vn"), anyString(), anyString());
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification notification = notificationCaptor.getValue();
        assertEquals("SEMESTER_AUTO_CLOSED", notification.getNotificationType());
        assertEquals(admin, notification.getCreatedBy());
        assertTrue(notification.getContent().contains("đã được hệ thống tự động đóng"));

        ArgumentCaptor<List<NotificationRecipient>> recipientsCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRecipientRepository).saveAll(recipientsCaptor.capture());
        List<NotificationRecipient> recipients = recipientsCaptor.getValue();
        assertEquals(1, recipients.size());
        assertEquals(admin, recipients.get(0).getUser());
        assertFalse(semester.getIsActive());
    }

    @Test
    void forceCloseSemester_writesAuditLogAndSendsInAppNotificationToAdmins() {
        Semester semester = activeSemester();
        ForceCloseSemesterRequest request = forceRequest();
        mockOpenSemester(semester);
        mockClosureCounts(2L, 3L);
        when(semesterRepository.save(any(Semester.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SystemRole adminRole = systemRole(1, "Admin");
        UserAccount admin = user(99, 1, "admin@fpt.edu.vn", "Admin User");
        when(systemRoleRepository.findByRoleName("Admin")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByRoleIDAndIsDeletedFalse(1)).thenReturn(List.of(admin));
        when(userRepository.findByUserIDAndIsDeletedFalse(99)).thenReturn(Optional.of(admin));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SemesterCloseResponse result = semesterService.forceCloseSemester(1, request, adminUser);

        assertTrue(result.isSuccess());
        assertTrue(result.isForced());
        verify(auditLogRepository).save(any(AuditLog.class));

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification notification = notificationCaptor.getValue();
        assertEquals("SEMESTER_FORCE_CLOSED", notification.getNotificationType());
        assertEquals(admin, notification.getCreatedBy());
        assertTrue(notification.getContent().contains("Admin userID=99"));
        assertTrue(notification.getContent().contains("Kết thúc học kỳ theo quyết định khẩn cấp"));

        ArgumentCaptor<List<NotificationRecipient>> recipientsCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRecipientRepository).saveAll(recipientsCaptor.capture());
        List<NotificationRecipient> recipients = recipientsCaptor.getValue();
        assertEquals(1, recipients.size());
        assertEquals(admin, recipients.get(0).getUser());
    }

    @Test
    void closeSemester_returnsConflictWhenAlreadyClosed() {
        Semester semester = activeSemester();
        semester.setIsActive(false);
        when(semesterRepository.findBySemesterIDAndIsDeletedFalse(1)).thenReturn(Optional.of(semester));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> semesterService.closeSemester(1, adminUser)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("Semester is already closed", exception.getMessage());
        verify(semesterRepository, never()).save(any(Semester.class));
    }

    private void mockOpenSemester(Semester semester) {
        when(semesterRepository.findBySemesterIDAndIsDeletedFalse(1)).thenReturn(Optional.of(semester));
    }

    private void mockClosureCounts(long unfinishedEventCount, long lockedScoreCount) {
        when(eventRepository.countUnfinishedEventsBySemesterId(eq(1), any(Collection.class)))
                .thenReturn(unfinishedEventCount);
        when(eventRepository.countLockedScoreEventsBySemesterId(1)).thenReturn(lockedScoreCount);
    }

    private SystemRole systemRole(Integer roleId, String roleName) {
        SystemRole role = new SystemRole();
        role.setRoleID(roleId);
        role.setRoleName(roleName);
        role.setIsDeleted(false);
        return role;
    }

    private Club club(Integer clubId, String clubName) {
        Club club = new Club();
        club.setClubID(clubId);
        club.setClubName(clubName);
        club.setClubStatus("Active");
        club.setIsDeleted(false);
        return club;
    }

    private MemberRankingDTO ranking(Integer rank, UserAccount user) {
        return new MemberRankingDTO(
                rank,
                user.getUserID(),
                user.getFullName(),
                user.getEmail(),
                10,
                "FPT Club",
                100 - rank,
                40,
                30,
                30 - rank
        );
    }

    private MemberRankingSnapshot snapshot(Integer rank, UserAccount user, Club club) {
        MemberRankingSnapshot snapshot = new MemberRankingSnapshot();
        snapshot.setSemesterID(1);
        snapshot.setClubID(club.getClubID());
        snapshot.setUserID(user.getUserID());
        snapshot.setFullName(user.getFullName());
        snapshot.setEmail(user.getEmail());
        snapshot.setRank(rank);
        snapshot.setTotalScore(100 - rank);
        snapshot.setContributionPoint(40);
        snapshot.setEventParticipationPoint(30);
        snapshot.setPerformancePoint(30 - rank);
        snapshot.setIsDeleted(false);
        return snapshot;
    }

    private UserAccount user(Integer userId, Integer roleId, String email, String fullName) {
        UserAccount user = new UserAccount();
        user.setUserID(userId);
        user.setRoleID(roleId);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setIsDeleted(false);
        return user;
    }

    private ForceCloseSemesterRequest forceRequest() {
        ForceCloseSemesterRequest request = new ForceCloseSemesterRequest();
        request.setReason("Kết thúc học kỳ theo quyết định khẩn cấp");
        return request;
    }

    private Semester activeSemester() {
        Semester semester = new Semester();
        semester.setSemesterID(1);
        semester.setSemesterCode("SU26");
        semester.setStartDate(LocalDate.of(2026, 5, 1));
        semester.setEndDate(LocalDate.of(2026, 8, 31));
        semester.setIsActive(true);
        semester.setIsDeleted(false);
        return semester;
    }
}
