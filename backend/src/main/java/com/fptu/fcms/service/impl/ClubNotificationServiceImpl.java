package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateNotificationRequest;
import com.fptu.fcms.dto.response.MyNotificationResponse;
import com.fptu.fcms.dto.response.NotificationPageResponse;
import com.fptu.fcms.dto.response.NotificationResponse;
import com.fptu.fcms.dto.response.UnreadNotificationCountResponse;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Notification;
import com.fptu.fcms.entity.NotificationRecipient;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.NotificationRecipientRepository;
import com.fptu.fcms.repository.NotificationRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClubNotificationServiceImpl implements ClubNotificationService {

    private static final String LEADER_ROLE_NAME = "Leader";
    private static final String SUCCESS_MESSAGE = "Gửi thông báo thành công";
    private static final String DEFAULT_NOTIFICATION_TYPE = "CLUB_ANNOUNCEMENT";
    private static final int MAX_PAGE_SIZE = 50;

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final SemesterRepository semesterRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public NotificationResponse createNotification(
            Integer clubId,
            CreateNotificationRequest request,
            UserPrincipal currentUser) {
        Integer currentUserId = resolveCurrentUserId(currentUser);
        String content = normalizeContent(request);
        Club club = clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new BusinessRuleException("CLB không tồn tại.", HttpStatus.NOT_FOUND));
        UserAccount creator = userRepository.findByUserIDAndIsDeletedFalse(currentUserId)
                .orElseThrow(() -> new BusinessRuleException("Tài khoản không tồn tại.", HttpStatus.UNAUTHORIZED));
        Integer activeSemesterId = resolveActiveSemesterId();

        assertCurrentUserIsActiveLeaderOfClub(clubId, creator.getUserID(), activeSemesterId);

        List<Integer> recipientUserIds = clubMembershipRepository.findActiveRecipientUserIdsByClubId(
                clubId,
                activeSemesterId
        );
        Set<Integer> distinctRecipientUserIds = new LinkedHashSet<>(recipientUserIds);
        if (distinctRecipientUserIds.isEmpty()) {
            throw new BusinessRuleException("CLB không có thành viên active để nhận thông báo.", HttpStatus.BAD_REQUEST);
        }

        LocalDateTime createdAt = LocalDateTime.now();
        Notification notification = new Notification();
        notification.setClub(club);
        notification.setCreatedBy(creator);
        notification.setTitle(normalizeTitle(request, club));
        notification.setNotificationType(normalizeNotificationType(request));
        notification.setContent(content);
        notification.setCreatedAt(createdAt);
        notification.setIsDeleted(false);

        Notification savedNotification = notificationRepository.saveAndFlush(notification);
        insertRecipients(savedNotification.getNotificationID(), List.copyOf(distinctRecipientUserIds));

        return new NotificationResponse(
                savedNotification.getNotificationID(),
                club.getClubID(),
                savedNotification.getTitle(),
                savedNotification.getNotificationType(),
                savedNotification.getContent(),
                creator.getUserID(),
                savedNotification.getCreatedAt(),
                distinctRecipientUserIds.size(),
                SUCCESS_MESSAGE
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getMyNotifications(
            UserPrincipal currentUser,
            String keyword,
            int page,
            int size) {
        Integer currentUserId = resolveCurrentUserId(currentUser);
        PageRequest pageRequest = PageRequest.of(normalizePage(page), normalizeSize(size));
        Page<NotificationRecipient> notificationPage = notificationRecipientRepository.findMyNotifications(
                currentUserId,
                normalizeKeyword(keyword),
                pageRequest
        );
        List<MyNotificationResponse> content = notificationPage.getContent()
                .stream()
                .map(this::toMyNotificationResponse)
                .toList();
        long unreadCount = notificationRecipientRepository.countUnreadByUserId(currentUserId);

        return new NotificationPageResponse(
                content,
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                unreadCount
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MyNotificationResponse getNotificationDetail(Integer notificationId, UserPrincipal currentUser) {
        return markAsRead(notificationId, currentUser);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MyNotificationResponse markAsRead(Integer notificationId, UserPrincipal currentUser) {
        Integer currentUserId = resolveCurrentUserId(currentUser);
        NotificationRecipient recipient = notificationRecipientRepository
                .findByNotificationIdAndUserId(notificationId, currentUserId)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy thông báo của tài khoản hiện tại.", HttpStatus.NOT_FOUND));

        if (!Boolean.TRUE.equals(recipient.getIsRead())) {
            recipient.setIsRead(true);
            recipient.setReadAt(LocalDateTime.now());
            recipient = notificationRecipientRepository.save(recipient);
        }

        return toMyNotificationResponse(recipient);
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse getUnreadCount(UserPrincipal currentUser) {
        Integer currentUserId = resolveCurrentUserId(currentUser);
        return new UnreadNotificationCountResponse(notificationRecipientRepository.countUnreadByUserId(currentUserId));
    }

    private Integer resolveCurrentUserId(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException("Vui lòng đăng nhập để xem thông báo.", HttpStatus.UNAUTHORIZED);
        }
        return currentUser.getUserId();
    }

    private MyNotificationResponse toMyNotificationResponse(NotificationRecipient recipient) {
        Notification notification = recipient.getNotification();
        Club club = notification.getClub();
        UserAccount creator = notification.getCreatedBy();

        return new MyNotificationResponse(
                notification.getNotificationID(),
                recipient.getRecipientID(),
                club.getClubID(),
                club.getClubName(),
                resolveResponseTitle(notification, club),
                resolveResponseType(notification),
                notification.getContent(),
                creator.getUserID(),
                creator.getFullName(),
                notification.getCreatedAt(),
                recipient.getIsRead(),
                recipient.getReadAt()
        );
    }

    private String normalizeContent(CreateNotificationRequest request) {
        if (request == null || request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BusinessRuleException("Nội dung thông báo không được để trống", HttpStatus.BAD_REQUEST);
        }

        String content = request.getContent().trim();
        if (content.length() > 5000) {
            throw new BusinessRuleException("Nội dung thông báo không được vượt quá 5000 ký tự", HttpStatus.BAD_REQUEST);
        }
        return content;
    }

    private String normalizeTitle(CreateNotificationRequest request, Club club) {
        if (request == null || request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return "Thông báo từ " + club.getClubName();
        }
        String title = request.getTitle().trim();
        if (title.length() > 255) {
            throw new BusinessRuleException("Tiêu đề thông báo không được vượt quá 255 ký tự", HttpStatus.BAD_REQUEST);
        }
        return title;
    }

    private String normalizeNotificationType(CreateNotificationRequest request) {
        if (request == null || request.getNotificationType() == null || request.getNotificationType().trim().isEmpty()) {
            return DEFAULT_NOTIFICATION_TYPE;
        }
        String notificationType = request.getNotificationType().trim();
        if (notificationType.length() > 50) {
            throw new BusinessRuleException("Loại thông báo không được vượt quá 50 ký tự", HttpStatus.BAD_REQUEST);
        }
        return notificationType;
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null ? null : keyword.trim();
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private String resolveResponseTitle(Notification notification, Club club) {
        if (notification.getTitle() == null || notification.getTitle().trim().isEmpty()) {
            return "Thông báo từ " + club.getClubName();
        }
        return notification.getTitle();
    }

    private String resolveResponseType(Notification notification) {
        if (notification.getNotificationType() == null || notification.getNotificationType().trim().isEmpty()) {
            return DEFAULT_NOTIFICATION_TYPE;
        }
        return notification.getNotificationType();
    }

    private Integer resolveActiveSemesterId() {
        Semester activeSemester = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy học kỳ active.", HttpStatus.INTERNAL_SERVER_ERROR));
        return activeSemester.getSemesterID();
    }

    private void assertCurrentUserIsActiveLeaderOfClub(Integer clubId, Integer userId, Integer semesterId) {
        ClubRole leaderRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse(LEADER_ROLE_NAME)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy vai trò Leader.", HttpStatus.INTERNAL_SERVER_ERROR));

        boolean isLeader = clubMembershipRepository.existsActiveLeaderInClub(
                clubId,
                userId,
                semesterId,
                leaderRole.getClubRoleID()
        );

        if (!isLeader) {
            throw new BusinessRuleException("Chỉ Leader active của CLB mới được gửi thông báo.", HttpStatus.FORBIDDEN);
        }
    }

    private void insertRecipients(Integer notificationId, List<Integer> recipientUserIds) {
        String sql = """
                INSERT INTO tblNotificationRecipients
                (notificationID, userID, isRead, readAt, createdAt)
                VALUES (?, ?, 0, NULL, GETDATE())
                """;

        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int index) throws SQLException {
                ps.setInt(1, notificationId);
                ps.setInt(2, recipientUserIds.get(index));
            }

            @Override
            public int getBatchSize() {
                return recipientUserIds.size();
            }
        });

        if (results.length != recipientUserIds.size()) {
            throw new BusinessRuleException("Không thể gửi thông báo đến toàn bộ thành viên.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        for (int result : results) {
            if (result == Statement.EXECUTE_FAILED) {
                throw new BusinessRuleException("Không thể gửi thông báo đến toàn bộ thành viên.", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}