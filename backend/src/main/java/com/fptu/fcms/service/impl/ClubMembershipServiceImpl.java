package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.MembershipUpdateRequest;
import com.fptu.fcms.dto.response.ClubLeadershipResponse;
import com.fptu.fcms.dto.response.ClubLeadershipResponse.LeadershipMemberDto;
import com.fptu.fcms.dto.response.LeadershipChangeResponse;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserAccountRepository;
import com.fptu.fcms.service.ClubMembershipService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClubMembershipServiceImpl implements ClubMembershipService {

    // ── clubRoleID (khớp Seed Data SQLQuery2.sql) ─────────────────────────────
    private static final int ROLE_LEADER      = 1;
    private static final int ROLE_VICE_LEADER = 2;
    private static final int ROLE_MEMBER      = 3;

    // ── systemRoleID ──────────────────────────────────────────────────────────
    private static final int SYSTEM_ROLE_ICPDP = 2;

    private static final Map<String, Integer> TARGET_ROLE_MAP = Map.of(
            "LEADER",      ROLE_LEADER,
            "VICE_LEADER", ROLE_VICE_LEADER,
            "MEMBER",      ROLE_MEMBER
    );

    private final ClubMembershipRepository membershipRepo;
    private final DisciplineLogRepository  disciplineRepo;
    private final UserAccountRepository    userRepo;
    private final SemesterRepository       semesterRepo;

    // ══════════════════════════════════════════════════════════════════════════
    //  changeLeadership — APPOINT hoặc DISMISS, toàn bộ atomic
    // ══════════════════════════════════════════════════════════════════════════
    @Override
    @Transactional
    public LeadershipChangeResponse changeLeadership(MembershipUpdateRequest request, Integer actorID) {

        log.info("[LEADERSHIP] actorID={} action={} clubID={} targetUserID={} targetRole={}",
                actorID, request.action(), request.clubID(), request.targetUserID(), request.targetRole());

        // 1. Chỉ ICPDP mới được thao tác
        validateActorIsIcpdp(actorID);

        // 2. Học kỳ đang active
        Semester semester = semesterRepo.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException(
                        "NO_ACTIVE_SEMESTER",
                        "Hiện tại không có học kỳ nào đang hoạt động trong hệ thống.",
                        HttpStatus.CONFLICT));

        // 3. Kiểm tra target user tồn tại
        UserAccount targetUser = userRepo.findByUserIDAndIsDeletedFalse(request.targetUserID())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy tài khoản người dùng với ID=" + request.targetUserID()));

        return switch (request.action()) {
            case "APPOINT" -> processAppoint(request, semester, targetUser);
            case "DISMISS" -> processDismiss(request, semester, targetUser);
            default -> throw new BusinessRuleException("INVALID_ACTION",
                    "Hành động không hợp lệ: " + request.action());
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getCurrentLeadership — read-only
    // ══════════════════════════════════════════════════════════════════════════
    @Override
    @Transactional(readOnly = true)
    public ClubLeadershipResponse getCurrentLeadership(Integer clubID) {

        Semester semester = semesterRepo.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException(
                        "NO_ACTIVE_SEMESTER",
                        "Hiện tại không có học kỳ nào đang hoạt động.",
                        HttpStatus.CONFLICT));

        List<ClubMembership> memberships = membershipRepo
                .findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
                        clubID, semester.getSemesterID(),
                        List.of(ROLE_LEADER, ROLE_VICE_LEADER, ROLE_MEMBER));

        // Batch-load users tránh N+1
        List<Integer> userIDs = memberships.stream().map(ClubMembership::getUserID).toList();
        Map<Integer, UserAccount> userMap = userRepo.findAllById(userIDs)
                .stream().collect(Collectors.toMap(UserAccount::getUserID, u -> u));

        Map<Integer, String> roleNameMap = Map.of(
                ROLE_LEADER,      "Leader",
                ROLE_VICE_LEADER, "ViceLeader",
                ROLE_MEMBER,      "Member");

        List<LeadershipMemberDto> dtoList = memberships.stream()
                .map(m -> {
                    UserAccount u = userMap.get(m.getUserID());
                    return new LeadershipMemberDto(
                            m.getMembershipID(),
                            m.getUserID(),
                            u != null ? u.getFullName() : "N/A",
                            u != null ? u.getEmail()    : "N/A",
                            m.getClubRoleID(),
                            roleNameMap.getOrDefault(m.getClubRoleID(), "Unknown"),
                            m.getJoinedDate());
                })
                .sorted((a, b) -> Integer.compare(a.clubRoleID(), b.clubRoleID()))
                .toList();

        return new ClubLeadershipResponse(
                clubID, semester.getSemesterID(), semester.getSemesterCode(), dtoList);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  APPOINT
    // ══════════════════════════════════════════════════════════════════════════
    private LeadershipChangeResponse processAppoint(
            MembershipUpdateRequest request, Semester semester, UserAccount targetUser) {

        if (request.targetRole() == null || request.targetRole().isBlank()) {
            throw new BusinessRuleException("MISSING_TARGET_ROLE",
                    "targetRole là bắt buộc khi action=APPOINT.");
        }

        int newRoleID = resolveTargetRoleID(request.targetRole());

        // [BR-L01] Chặn kỷ luật Active — áp dụng cho Leader & ViceLeader
        if (newRoleID == ROLE_LEADER || newRoleID == ROLE_VICE_LEADER) {
            boolean hasDiscipline = disciplineRepo
                    .existsByUserIDAndDisciplineStatus(targetUser.getUserID(), "Active");
            if (hasDiscipline) {
                throw new BusinessRuleException(
                        "DISCIPLINE_BLOCK",
                        String.format(
                            "Không thể bổ nhiệm [%s] vào vị trí %s: " +
                            "tài khoản đang có kỷ luật Active trong Nhật ký kỷ luật.",
                            targetUser.getFullName(), request.targetRole()),
                        HttpStatus.FORBIDDEN);
            }
        }

        // [BR-L02] Nếu bổ nhiệm LEADER → tự động soft-delete Leader cũ (atomic)
        if (newRoleID == ROLE_LEADER) {
            membershipRepo.findByClubIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                    request.clubID(), semester.getSemesterID(), ROLE_LEADER)
                .ifPresent(oldLeader -> {
                    if (!oldLeader.getUserID().equals(targetUser.getUserID())) {
                        log.info("[LEADERSHIP] Bãi nhiệm Leader cũ membershipID={} userID={}",
                                oldLeader.getMembershipID(), oldLeader.getUserID());
                        oldLeader.setIsDeleted(true);
                        membershipRepo.save(oldLeader);
                    }
                });
        }

        // Upsert: cập nhật nếu đã có membership, tạo mới nếu chưa
        ClubMembership membership = membershipRepo
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        request.clubID(), targetUser.getUserID(), semester.getSemesterID())
                .orElseGet(() -> ClubMembership.builder()
                        .clubID(request.clubID())
                        .userID(targetUser.getUserID())
                        .semesterID(semester.getSemesterID())
                        .joinedDate(LocalDate.now())
                        .isDeleted(false)
                        .build());

        membership.setClubRoleID(newRoleID);
        membershipRepo.save(membership);

        log.info("[LEADERSHIP] APPOINT OK: userID={} → {} CLB={} kỳ={}",
                targetUser.getUserID(), request.targetRole(),
                request.clubID(), semester.getSemesterCode());

        return new LeadershipChangeResponse(
                "APPOINT", request.clubID(),
                targetUser.getUserID(), targetUser.getFullName(),
                request.targetRole(),
                semester.getSemesterID(), semester.getSemesterCode(),
                LocalDateTime.now(),
                String.format("Bổ nhiệm thành công [%s] vào vị trí %s trong CLB %d, kỳ %s.",
                        targetUser.getFullName(), request.targetRole(),
                        request.clubID(), semester.getSemesterCode()));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  DISMISS
    // ══════════════════════════════════════════════════════════════════════════
    private LeadershipChangeResponse processDismiss(
            MembershipUpdateRequest request, Semester semester, UserAccount targetUser) {

        ClubMembership membership = membershipRepo
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        request.clubID(), targetUser.getUserID(), semester.getSemesterID())
                .orElseThrow(() -> new BusinessRuleException(
                        "MEMBERSHIP_NOT_FOUND",
                        String.format("Không tìm thấy membership của userID=%d trong clubID=%d kỳ %s.",
                                targetUser.getUserID(), request.clubID(), semester.getSemesterCode()),
                        HttpStatus.NOT_FOUND));

        String oldRoleName = resolveRoleName(membership.getClubRoleID());
        membership.setIsDeleted(true);
        membershipRepo.save(membership);

        log.info("[LEADERSHIP] DISMISS OK: userID={} role={} CLB={} kỳ={}",
                targetUser.getUserID(), oldRoleName,
                request.clubID(), semester.getSemesterCode());

        return new LeadershipChangeResponse(
                "DISMISS", request.clubID(),
                targetUser.getUserID(), targetUser.getFullName(),
                null,
                semester.getSemesterID(), semester.getSemesterCode(),
                LocalDateTime.now(),
                String.format("Bãi nhiệm thành công [%s] (vai trò: %s) khỏi CLB %d, kỳ %s.",
                        targetUser.getFullName(), oldRoleName,
                        request.clubID(), semester.getSemesterCode()));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    /** [BR-ICPDP] Chỉ roleID=2 (ICPDP) mới được thao tác */
    private void validateActorIsIcpdp(Integer actorID) {
        boolean isIcpdp = userRepo.existsByUserIDAndRoleIDAndIsDeletedFalse(actorID, SYSTEM_ROLE_ICPDP);
        if (!isIcpdp) {
            throw new BusinessRuleException(
                    "INSUFFICIENT_PERMISSION",
                    "Chỉ tài khoản ICPDP mới có quyền thay đổi Ban điều hành CLB.",
                    HttpStatus.FORBIDDEN);
        }
    }

    private int resolveTargetRoleID(String targetRole) {
        Integer id = TARGET_ROLE_MAP.get(targetRole);
        if (id == null) throw new BusinessRuleException("INVALID_TARGET_ROLE",
                "targetRole không hợp lệ: " + targetRole);
        return id;
    }

    private String resolveRoleName(int clubRoleID) {
        return switch (clubRoleID) {
            case ROLE_LEADER      -> "Leader";
            case ROLE_VICE_LEADER -> "ViceLeader";
            case ROLE_MEMBER      -> "Member";
            default               -> "Unknown";
        };
    }
}
