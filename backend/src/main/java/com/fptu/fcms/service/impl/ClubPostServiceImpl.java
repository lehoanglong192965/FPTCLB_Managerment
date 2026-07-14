package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateClubPostRequest;
import com.fptu.fcms.dto.response.ClubPostPageResponse;
import com.fptu.fcms.dto.response.ClubPostResponse;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubPost;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Notification;
import com.fptu.fcms.entity.NotificationRecipient;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubPostRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.NotificationRecipientRepository;
import com.fptu.fcms.repository.NotificationRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClubPostServiceImpl implements ClubPostService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ClubPostRepository clubPostRepository;
    private final ClubRepository clubRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final SemesterRepository semesterRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;

    @Override
    @Transactional
    public ClubPostResponse createPost(Integer clubId, CreateClubPostRequest request, UserPrincipal currentUser) {
        Integer userId = resolveUserId(currentUser);
        Club club = clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new BusinessRuleException("CLB không tồn tại.", HttpStatus.NOT_FOUND));

        Integer activeSemesterId = resolveActiveSemesterId();
        boolean isBoardMember = clubMembershipRepository.existsActiveMembershipByClubUserAndRoleNames(
                clubId, userId, List.of("Leader", "ViceLeader")
        );
        if (!isBoardMember) {
            throw new BusinessRuleException("Chỉ Leader/Phó Leader của CLB mới được đăng bài lên bảng tin.", HttpStatus.FORBIDDEN);
        }

        ClubPost post = new ClubPost();
        post.setClubID(clubId);
        post.setCreatedBy(userId);
        post.setContent(request.getContent().trim());
        post.setCreatedAt(LocalDateTime.now());
        post.setIsDeleted(false);
        ClubPost saved = clubPostRepository.save(post);

        notifyClubMembersOfNewPost(club, saved, activeSemesterId);

        return toResponse(saved, activeSemesterId);
    }

    private void notifyClubMembersOfNewPost(Club club, ClubPost post, Integer activeSemesterId) {
        if (activeSemesterId == null) return;

        List<Integer> boardRoleIds = List.of("Leader", "ViceLeader").stream()
                .map(clubRoleRepository::findByRoleNameAndIsDeletedFalse)
                .filter(java.util.Optional::isPresent)
                .map(opt -> opt.get().getClubRoleID())
                .toList();

        List<Integer> recipientUserIds = clubMembershipRepository.findActiveRecipientUserIdsByClubIdExcludingRoles(
                club.getClubID(), activeSemesterId, boardRoleIds
        );
        Set<Integer> distinctRecipientUserIds = new LinkedHashSet<>(recipientUserIds);
        if (distinctRecipientUserIds.isEmpty()) return;

        UserAccount author = userRepository.findByUserIDAndIsDeletedFalse(post.getCreatedBy()).orElse(null);
        if (author == null) return;

        String preview = post.getContent().length() > 200
                ? post.getContent().substring(0, 200) + "..."
                : post.getContent();

        Notification notification = new Notification();
        notification.setClub(club);
        notification.setCreatedBy(author);
        notification.setTitle("Bài đăng mới từ " + club.getClubName());
        notification.setNotificationType("CLUB_POST");
        notification.setContent(preview);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setActionUrl("/member/my-clubs?open=1");
        notification.setActionLabel("Xem bảng tin");
        notification.setIsDeleted(false);
        Notification savedNotification = notificationRepository.save(notification);

        List<NotificationRecipient> rows = distinctRecipientUserIds.stream().map(recipientId -> {
            NotificationRecipient row = new NotificationRecipient();
            row.setNotification(savedNotification);
            row.setUser(userRepository.getReferenceById(recipientId));
            row.setIsRead(false);
            row.setCreatedAt(LocalDateTime.now());
            return row;
        }).toList();
        notificationRecipientRepository.saveAll(rows);
    }

    @Override
    @Transactional(readOnly = true)
    public ClubPostPageResponse getPosts(Integer clubId, UserPrincipal currentUser, int page, int size) {
        Integer userId = resolveUserId(currentUser);
        Integer activeSemesterId = resolveActiveSemesterId();

        boolean isMember = clubMembershipRepository
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(clubId, userId, activeSemesterId)
                .isPresent();
        if (!isMember) {
            throw new BusinessRuleException("Chỉ thành viên CLB mới được xem bảng tin.", HttpStatus.FORBIDDEN);
        }

        PageRequest pageRequest = PageRequest.of(normalizePage(page), normalizeSize(size));
        Page<ClubPost> postPage = clubPostRepository.findByClubIDAndIsDeletedFalseOrderByCreatedAtDesc(clubId, pageRequest);

        List<ClubPostResponse> content = postPage.getContent().stream()
                .map(p -> toResponse(p, activeSemesterId))
                .toList();

        return new ClubPostPageResponse(
                content,
                postPage.getNumber(),
                postPage.getSize(),
                postPage.getTotalElements(),
                postPage.getTotalPages()
        );
    }

    private ClubPostResponse toResponse(ClubPost post, Integer activeSemesterId) {
        UserAccount author = userRepository.findByUserIDAndIsDeletedFalse(post.getCreatedBy()).orElse(null);
        String authorName = author != null ? author.getFullName() : "Thành viên CLB";
        String authorRoleName = resolveAuthorRoleName(post.getClubID(), post.getCreatedBy(), activeSemesterId);

        return new ClubPostResponse(
                post.getPostID(),
                post.getClubID(),
                post.getCreatedBy(),
                authorName,
                authorRoleName,
                post.getContent(),
                post.getCreatedAt()
        );
    }

    private String resolveAuthorRoleName(Integer clubId, Integer userId, Integer activeSemesterId) {
        if (activeSemesterId == null) return "Member";
        return clubMembershipRepository.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(clubId, userId, activeSemesterId)
                .map(ClubMembership::getClubRoleID)
                .flatMap(clubRoleRepository::findById)
                .map(ClubRole::getRoleName)
                .orElse("Member");
    }

    private Integer resolveUserId(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException("Vui lòng đăng nhập.", HttpStatus.UNAUTHORIZED);
        }
        return currentUser.getUserId();
    }

    private Integer resolveActiveSemesterId() {
        return semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .map(Semester::getSemesterID)
                .orElse(null);
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizeSize(int size) {
        if (size <= 0) return 20;
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
