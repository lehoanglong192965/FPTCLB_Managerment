package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubBoardChangeRequest;
import com.fptu.fcms.dto.response.ClubBoardMemberResponse;
import com.fptu.fcms.entity.*;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ thay đổi Ban điều hành CLB.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LUỒNG NGHIỆP VỤ CHÍNH                                             │
 * │                                                                     │
 * │  BỔ NHIỆM (APPOINT):                                               │
 * │    1. Kiểm tra CLB, User, Học kỳ tồn tại & hợp lệ                  │
 * │    2. Kiểm tra User KHÔNG phải cán bộ ICPDP/Admin                  │
 * │    3. Nếu role = Leader:                                            │
 * │       a. Kiểm tra User không có án kỷ luật Active                  │
 * │       b. Kiểm tra User chưa làm Leader ở CLB khác trong kỳ         │
 * │       c. Bãi nhiệm Leader hiện tại (soft delete) nếu đã có         │
 * │    4. Tạo hoặc cập nhật membership với vai trò mới                  │
 * │    5. Ghi AuditLog cho thao tác nhạy cảm                           │
 * │                                                                     │
 * │  BÃI NHIỆM (DISMISS):                                              │
 * │    1–2. Kiểm tra giống trên                                        │
 * │    3. Soft delete membership (isDeleted = true)                     │
 * │    4. Ghi AuditLog                                                  │
 * │                                                                     │
 * │  @Transactional đảm bảo toàn bộ luồng là ATOMIC:                   │
 * │  Nếu bất kỳ bước nào thất bại → rollback tất cả thay đổi           │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Các Business Rule được kiểm tra:
 *   BR-01: Chặn gán Leader nếu sinh viên có án kỷ luật Active (DisciplineLog)
 *   BR-02: Chặn gán Leader/Member cho tài khoản là cán bộ ICPDP (SystemRole.roleName = 'ICPDP')
 *   BR-03: Một sinh viên chỉ được làm Leader của 1 CLB duy nhất trong 1 học kỳ
 *   BR-04: Khi bổ nhiệm Leader mới → tự động bãi nhiệm Leader cũ (nếu có)
 */
@Service
public class ClubBoardService {

    // =====================================================================
    // Hằng số vai trò (khớp với Seed Data trong SQL)
    // =====================================================================

    /** ID vai trò Leader trong bảng ClubRole — theo Seed Data */
    private static final int CLUB_ROLE_ID_LEADER = 1;

    /** Tên vai trò ICPDP trong SystemRole — cán bộ phòng IC-PDP */
    private static final String SYSTEM_ROLE_ICPDP = "ICPDP";

    /** Trạng thái kỷ luật đang hiệu lực */
    private static final String DISCIPLINE_ACTIVE = "Active";

    /** Tên bảng ghi audit log — phải khớp với tên bảng DB */
    private static final String AUDIT_TABLE = "ClubMembership";

    // =====================================================================
    // Dependencies (inject qua constructor — best practice Spring)
    // =====================================================================

    private final ClubMembershipRepository membershipRepo;
    private final UserRepository userRepo;
    private final SystemRoleRepository systemRoleRepo;
    private final DisciplineLogRepository disciplineRepo;
    private final SemesterRepository semesterRepo;
    private final ClubRoleRepository clubRoleRepo;
    private final AuditLogRepository auditRepo;

    public ClubBoardService(
            ClubMembershipRepository membershipRepo,
            UserRepository userRepo,
            SystemRoleRepository systemRoleRepo,
            DisciplineLogRepository disciplineRepo,
            SemesterRepository semesterRepo,
            ClubRoleRepository clubRoleRepo,
            AuditLogRepository auditRepo
    ) {
        this.membershipRepo = membershipRepo;
        this.userRepo = userRepo;
        this.systemRoleRepo = systemRoleRepo;
        this.disciplineRepo = disciplineRepo;
        this.semesterRepo = semesterRepo;
        this.clubRoleRepo = clubRoleRepo;
        this.auditRepo = auditRepo;
    }

    // =====================================================================
    // API 1: THAY ĐỔI BAN ĐIỀU HÀNH (BỔ NHIỆM / BÃI NHIỆM)
    // =====================================================================

    /**
     * Xử lý bổ nhiệm hoặc bãi nhiệm một thành viên trong Ban điều hành CLB.
     *
     * @Transactional đảm bảo toàn bộ method là một giao dịch ATOMIC:
     *   - Nếu bất kỳ bước nào throw exception → toàn bộ DB changes bị ROLLBACK
     *   - Đặc biệt quan trọng khi bãi nhiệm Leader cũ + bổ nhiệm Leader mới cùng lúc
     *
     * @param clubID   ID của CLB cần thay đổi ban điều hành
     * @param request  Thông tin yêu cầu (userID, action, newRole, reason)
     * @param actorID  ID của người thực hiện thao tác (lấy từ JWT token)
     * @return ClubBoardMemberResponse — thông tin membership sau khi thay đổi
     * @throws BusinessRuleException khi vi phạm bất kỳ Business Rule nào
     */
    @Transactional
    public ClubBoardMemberResponse changeBoardMember(
            Integer clubID,
            ClubBoardChangeRequest request,
            Integer actorID
    ) {
        // ─── BƯỚC 1: Lấy học kỳ đang Active ──────────────────────────────
        // Mọi thao tác membership đều gắn với học kỳ hiện tại
        Semester activeSemester = semesterRepo.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException(
                        "Hệ thống hiện không có học kỳ nào đang Active. " +
                                "Vui lòng kích hoạt học kỳ trước khi thay đổi ban điều hành.",
                        HttpStatus.CONFLICT
                ));

        // ─── BƯỚC 2: Kiểm tra User tồn tại và đang Active ─────────────────
        UserAccount targetUser = userRepo.findById(request.getUserID())
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy user với ID: " + request.getUserID(),
                        HttpStatus.NOT_FOUND
                ));

        // Chặn thao tác trên tài khoản đã bị vô hiệu hóa hoặc xóa
        if (Boolean.TRUE.equals(targetUser.getIsDeleted())) {
            throw new BusinessRuleException(
                    "Tài khoản đã bị xóa khỏi hệ thống. Không thể thực hiện thao tác.",
                    HttpStatus.GONE
            );
        }
        if (!"Active".equals(targetUser.getAccountStatus())) {
            throw new BusinessRuleException(
                    "Tài khoản của [" + targetUser.getFullName() + "] đang bị Suspended. " +
                            "Không thể gán vai trò CLB cho tài khoản bị tạm khóa.",
                    HttpStatus.FORBIDDEN
            );
        }

        // ─── BƯỚC 3: BR-A05 — Chặn cán bộ ICPDP (và Admin) ──────────────
        // IC-PDP staff are not allowed to join clubs as Member or Leader.
        // Validation chạy TRƯỚC khi lưu ClubMembership — áp dụng cho mọi action.
        validateUserCanJoinClub(targetUser);

        // ─── BƯỚC 4: Phân nhánh theo action ───────────────────────────────
        if ("APPOINT".equals(request.getAction())) {
            return handleAppoint(clubID, request, actorID, targetUser, activeSemester);
        } else {
            return handleDismiss(clubID, request, actorID, targetUser, activeSemester);
        }
    }

    // =====================================================================
    // XỬ LÝ BỔ NHIỆM (APPOINT)
    // =====================================================================

    /**
     * Xử lý bổ nhiệm — gán vai trò mới cho user trong CLB.
     * Nằm trong transaction của phương thức gọi (changeBoardMember).
     */
    private ClubBoardMemberResponse handleAppoint(
            Integer clubID,
            ClubBoardChangeRequest request,
            Integer actorID,
            UserAccount targetUser,
            Semester activeSemester
    ) {
        // Validate newRole bắt buộc khi APPOINT
        if (request.getNewRole() == null || request.getNewRole().isBlank()) {
            throw new BusinessRuleException(
                    "Vui lòng cung cấp newRole khi action = APPOINT " +
                            "(Leader / ViceLeader / Member)."
            );
        }

        // Resolve ClubRole entity từ tên vai trò
        ClubRole targetRole = clubRoleRepo.findByRoleNameAndIsDeletedFalse(request.getNewRole())
                .orElseThrow(() -> new BusinessRuleException(
                        "Vai trò CLB [" + request.getNewRole() + "] không tồn tại trong hệ thống.",
                        HttpStatus.BAD_REQUEST
                ));

        // ─── KIỂM TRA ĐẶC BIỆT CHO LEADER ────────────────────────────────
        boolean isAppointingLeader = (targetRole.getClubRoleID() == CLUB_ROLE_ID_LEADER);

        if (isAppointingLeader) {
            // BR-01: Chặn gán Leader nếu có án kỷ luật Active trong học kỳ hiện tại
            validateNoDiscipline(targetUser, activeSemester);

            // BR-A02: Chặn gán Leader nếu đã là Leader ở CLB KHÁC trong kỳ này
            // Message: "Student [studentID] is already Leader of another club." / HTTP 400
            validateLeaderExclusive(targetUser.getUserID(), activeSemester.getSemesterID(), clubID);

            // BR-04: Bãi nhiệm Leader cũ (nếu có) trước khi bổ nhiệm Leader mới
            // Đây là thao tác ATOMIC — cả hai phải cùng commit hoặc cùng rollback
            dismissCurrentLeader(clubID, activeSemester.getSemesterID(), actorID);
        }

        // ─── TẠO HOẶC CẬP NHẬT MEMBERSHIP ────────────────────────────────
        // Kiểm tra user đã có membership trong CLB này chưa (có thể là member bình thường)
        ClubMembership membership = membershipRepo
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        clubID, targetUser.getUserID(), activeSemester.getSemesterID()
                )
                .orElse(null);

        if (membership != null) {
            // User đã có membership → cập nhật vai trò (promote/demote)
            String oldRoleInfo = "clubRoleID=" + membership.getClubRoleID();
            membership.setClubRoleID(targetRole.getClubRoleID());
            membershipRepo.save(membership);

            // Ghi audit log: thay đổi vai trò
            writeAuditLog(
                    actorID,
                    "UPDATE_CLUB_ROLE",
                    membership.getMembershipID(),
                    oldRoleInfo,
                    "clubRoleID=" + targetRole.getClubRoleID() + " (" + targetRole.getRoleName() + ")",
                    buildAuditReason(request, "Cập nhật vai trò CLB")
            );
        } else {
            // User chưa có membership → tạo mới
            ClubMembership newMembership = new ClubMembership();
            newMembership.setClubID(clubID);
            newMembership.setUserID(targetUser.getUserID());
            newMembership.setSemesterID(activeSemester.getSemesterID());
            newMembership.setClubRoleID(targetRole.getClubRoleID());
            newMembership.setJoinedDate(LocalDate.now());
            newMembership.setIsDeleted(false);
            membership = membershipRepo.save(newMembership);

            // Ghi audit log: bổ nhiệm mới
            writeAuditLog(
                    actorID,
                    "APPOINT_MEMBER",
                    membership.getMembershipID(),
                    null,
                    "userID=" + targetUser.getUserID() +
                            ", role=" + targetRole.getRoleName() +
                            ", club=" + clubID +
                            ", semester=" + activeSemester.getSemesterCode(),
                    buildAuditReason(request, "Bổ nhiệm thành viên Ban điều hành")
            );
        }

        // Trả về response
        return buildResponse(membership, targetUser, targetRole, activeSemester);
    }

    // =====================================================================
    // XỬ LÝ BÃI NHIỆM (DISMISS)
    // =====================================================================

    /**
     * Xử lý bãi nhiệm — soft delete membership của user khỏi CLB.
     * Nằm trong transaction của phương thức gọi (changeBoardMember).
     */
    private ClubBoardMemberResponse handleDismiss(
            Integer clubID,
            ClubBoardChangeRequest request,
            Integer actorID,
            UserAccount targetUser,
            Semester activeSemester
    ) {
        // Tìm membership đang active của user trong CLB này
        ClubMembership membership = membershipRepo
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        clubID, targetUser.getUserID(), activeSemester.getSemesterID()
                )
                .orElseThrow(() -> new BusinessRuleException(
                        "User [" + targetUser.getFullName() + "] hiện không có membership " +
                                "trong CLB ID=" + clubID + " ở học kỳ " + activeSemester.getSemesterCode() +
                                ". Không thể bãi nhiệm.",
                        HttpStatus.NOT_FOUND
                ));

        // Lấy ClubRole để đưa vào response
        ClubRole currentRole = clubRoleRepo.findById(membership.getClubRoleID())
                .orElse(null);

        // Ghi audit log TRƯỚC khi soft delete (để lưu được oldValue)
        writeAuditLog(
                actorID,
                "DISMISS_MEMBER",
                membership.getMembershipID(),
                "userID=" + targetUser.getUserID() +
                        ", role=" + (currentRole != null ? currentRole.getRoleName() : "?") +
                        ", club=" + clubID,
                "isDeleted=true",
                buildAuditReason(request, "Bãi nhiệm khỏi Ban điều hành CLB")
        );

        // Soft delete membership
        membership.setIsDeleted(true);
        membershipRepo.save(membership);

        // Trả về thông tin membership vừa bãi nhiệm
        return buildResponse(membership, targetUser, currentRole, activeSemester);
    }

    // =====================================================================
    // API 2: LẤY DANH SÁCH BAN ĐIỀU HÀNH CLB HIỆN TẠI
    // =====================================================================

    /**
     * Lấy danh sách tất cả thành viên trong Ban điều hành của một CLB
     * tại học kỳ đang Active.
     *
     * @Transactional(readOnly = true): Tối ưu hiệu năng cho read-only query —
     * Spring sẽ dùng snapshot read, không acqure write locks.
     *
     * @param clubID ID của CLB
     * @return Danh sách ClubBoardMemberResponse
     */
    @Transactional(readOnly = true)
    public List<ClubBoardMemberResponse> getBoardMembers(Integer clubID) {
        // Lấy học kỳ Active
        Semester activeSemester = semesterRepo.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy học kỳ Active.",
                        HttpStatus.CONFLICT
                ));

        // Lấy danh sách membership active của CLB trong học kỳ này
        List<ClubMembership> memberships = membershipRepo
                .findBoardMembers(
                        clubID, activeSemester.getSemesterID()
                );

        // Map sang DTO response
        return memberships.stream()
                .map(m -> {
                    // Lấy thông tin User
                    UserAccount user = userRepo.findById(m.getUserID()).orElse(null);
                    // Lấy tên vai trò
                    ClubRole role = clubRoleRepo.findById(m.getClubRoleID()).orElse(null);
                    return buildResponse(m, user, role, activeSemester);
                })
                .collect(Collectors.toList());
    }

    // =====================================================================
    // PRIVATE HELPER: CÁC VALIDATION NGHIỆP VỤ
    // =====================================================================

    /**
     * BR-A05 — Kiểm tra user CÓ được phép tham gia CLB không.
     *
     * Rule: User có SystemRole.roleName = 'ICPDP' KHÔNG được phép:
     *   - Join Club (tự gia nhập)
     *   - Add Member (được thêm vào)
     *   - Assign Leader
     *   - Assign ViceLeader
     *
     * Validation chạy TRƯỚC mọi thao tác lưu ClubMembership.
     * HTTP 403 Forbidden — không phải lỗi dữ liệu mà là lỗi quyền nghiệp vụ.
     *
     * @param user UserAccount của người được thêm vào CLB
     * @throws BusinessRuleException (HTTP 403) nếu user là cán bộ ICPDP
     * @throws BusinessRuleException (HTTP 500) nếu roleID không tồn tại trong SystemRole
     */
    void validateUserCanJoinClub(UserAccount user) {
        SystemRole systemRole = systemRoleRepo.findById(user.getRoleID())
                .orElseThrow(() -> new BusinessRuleException(
                        "Tài khoản [" + user.getFullName() + "] (userID=" + user.getUserID() +
                                ") không có System Role hợp lệ trong hệ thống. " +
                                "Vui lòng kiểm tra dữ liệu tài khoản.",
                        HttpStatus.INTERNAL_SERVER_ERROR
                ));

        // BR-A05: ICPDP không được tham gia CLB dưới bất kỳ hình thức nào
        if (SYSTEM_ROLE_ICPDP.equals(systemRole.getRoleName())) {
            throw new BusinessRuleException(
                    "IC-PDP staff are not allowed to join clubs as Member or Leader.",
                    HttpStatus.FORBIDDEN
            );
        }

        // Admin hệ thống cũng không được có membership CLB
        if ("Admin".equals(systemRole.getRoleName())) {
            throw new BusinessRuleException(
                    "[BR-A05] Admin system account is not allowed to join clubs as Member or Leader.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    /**
     * @deprecated Thay bằng {@link #validateUserCanJoinClub(UserAccount)}.
     *             Giữ lại để không break nếu còn caller khác — xóa sau sprint này.
     */
    @Deprecated
    private void validateNotStaffAccount(UserAccount user, String action) {
        validateUserCanJoinClub(user);
    }

    /**
     * BR-01: Kiểm tra sinh viên không có án kỷ luật Active trong học kỳ hiện tại.
     *
     * Nếu DisciplineLog có bất kỳ record nào với:
     *   userID = user.userID AND semesterID = activeSemester.semesterID AND disciplineStatus = 'Active'
     * → ném BusinessRuleException, chặn bổ nhiệm Leader.
     *
     * Dùng disciplineRepo.hasActiveDiscipline() — method @Query tường minh —
     * vì Spring Data JPA derived query không parse đúng field "userID" / "semesterID"
     * (chữ D/I hoa liền nhau) dẫn đến lỗi "No property 'userId' found for type 'DisciplineLog'".
     *
     * @param user           UserAccount cần kiểm tra
     * @param activeSemester Học kỳ đang Active
     * @throws BusinessRuleException nếu sinh viên có án kỷ luật Active
     */
    private void validateNoDiscipline(UserAccount user, Semester activeSemester) {
        // Gọi @Query JPQL — tham chiếu đúng tên field entity "userID", "semesterID"
        boolean hasDiscipline = disciplineRepo.hasActiveDiscipline(
                user.getUserID(),
                activeSemester.getSemesterID(),
                DISCIPLINE_ACTIVE
        );

        if (hasDiscipline) {
            throw new BusinessRuleException(
                    "[BR-01] Không thể bổ nhiệm [" + user.getFullName() + "] làm Leader vì " +
                            "sinh viên này đang có án kỷ luật Active trong học kỳ " +
                            activeSemester.getSemesterCode() + ". " +
                            "Vui lòng giải quyết án kỷ luật trước khi bổ nhiệm."
            );
        }
    }

    /**
     * BR-A02 — Kiểm tra một student chỉ giữ role Leader tại tối đa 1 CLB trong cùng 1 học kỳ.
     *
     * Áp dụng cho cả hai trường hợp:
     *   (a) Thêm mới ClubMembership với role = Leader
     *   (b) Update role của membership hiện tại thành Leader
     *
     * Logic sử dụng countLeaderMembershipByUserAndSemesterExcludingClub() để:
     *   - Đếm số Leader membership trong tất cả CLB KHÁC với currentClubID
     *   - Tránh false-positive khi re-assign Leader trong cùng CLB (vì record đó đã tồn tại)
     *
     * Nếu count > 0 → user đã là Leader CLB khác → REJECT.
     * DB index UX_Membership_LeaderExclusive là lớp bảo vệ thứ hai chống race condition.
     *
     * @param userID        ID của student cần kiểm tra
     * @param semesterID    ID học kỳ hiện tại (Active semester)
     * @param currentClubID CLB đang xử lý (loại trừ khỏi count để tránh self-count)
     * @throws BusinessRuleException (HTTP 400) nếu student đã là Leader ở CLB khác trong kỳ
     */
    void validateLeaderExclusive(Integer userID, Integer semesterID, Integer currentClubID) {
        long leaderCountElsewhere = membershipRepo.countLeaderMembershipByUserAndSemesterExcludingClub(
                userID, semesterID, CLUB_ROLE_ID_LEADER, currentClubID
        );

        if (leaderCountElsewhere > 0) {
            throw new BusinessRuleException(
                    "Student " + userID + " is already Leader of another club.",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * @deprecated Thay bằng {@link #validateLeaderExclusive(Integer, Integer, Integer)}.
     *             Giữ để backward-compat — xóa sau sprint này.
     */
    @Deprecated
    private void validateNoLeaderInOtherClub(Integer userID, Integer semesterID, Integer currentClubID) {
        validateLeaderExclusive(userID, semesterID, currentClubID);
    }

    /**
     * BR-04: Bãi nhiệm Leader hiện tại của CLB trước khi bổ nhiệm Leader mới.
     *
     * Đây là thao tác ATOMIC cùng transaction với bổ nhiệm mới:
     *   - Nếu bổ nhiệm mới thất bại → cả hai đều rollback
     *   - Đảm bảo không bao giờ có trạng thái "CLB không có Leader"
     *     do lỗi xảy ra giữa chừng
     *
     * @param clubID     ID CLB
     * @param semesterID ID học kỳ active
     * @param actorID    ID người thực hiện (để ghi audit log)
     */
    private void dismissCurrentLeader(Integer clubID, Integer semesterID, Integer actorID) {
        // Tìm Leader hiện tại (nếu có)
        membershipRepo.findByClubIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                clubID, semesterID, CLUB_ROLE_ID_LEADER
        ).ifPresent(currentLeader -> {
            // Ghi audit log bãi nhiệm Leader cũ
            writeAuditLog(
                    actorID,
                    "AUTO_DISMISS_OLD_LEADER",
                    currentLeader.getMembershipID(),
                    "clubRoleID=" + CLUB_ROLE_ID_LEADER + " (Leader), userID=" + currentLeader.getUserID(),
                    "isDeleted=true (auto-dismissed do bổ nhiệm Leader mới)",
                    "Hệ thống tự động bãi nhiệm Leader cũ khi bổ nhiệm Leader mới"
            );

            // Soft delete membership của Leader cũ
            currentLeader.setIsDeleted(true);
            membershipRepo.save(currentLeader);
        });
    }

    // =====================================================================
    // PRIVATE HELPER: GHI AUDIT LOG
    // =====================================================================

    /**
     * Ghi một bản ghi vào AuditLog cho mọi thao tác nhạy cảm liên quan đến Ban điều hành.
     *
     * @param actorID    ID người thực hiện
     * @param actionType loại hành động (APPOINT_MEMBER, DISMISS_MEMBER, v.v.)
     * @param recordID   ID của bản ghi bị tác động (membershipID)
     * @param oldValue   giá trị cũ trước khi thay đổi (null nếu tạo mới)
     * @param newValue   giá trị mới sau khi thay đổi
     * @param reason     lý do thực hiện thao tác
     */
    private void writeAuditLog(Integer actorID, String actionType,
                               Integer recordID, String oldValue,
                               String newValue, String reason) {
        AuditLog log = new AuditLog();
        log.setActorID(actorID);
        log.setActionType(actionType);
        log.setTableName(AUDIT_TABLE);
        log.setRecordID(recordID);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setOverrideReason(reason != null ? reason : "Không có lý do được cung cấp");
        log.setExecutedAt(LocalDateTime.now());
        auditRepo.save(log);
    }

    /**
     * Build chuỗi reason cho audit log từ request.
     * Nếu request không có reason → dùng defaultReason.
     */
    private String buildAuditReason(ClubBoardChangeRequest request, String defaultReason) {
        return (request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason()
                : defaultReason;
    }

    // =====================================================================
    // PRIVATE HELPER: BUILD RESPONSE DTO
    // =====================================================================

    /**
     * Tạo ClubBoardMemberResponse từ các entity.
     * Xử lý null-safe cho trường hợp user hoặc role không tìm thấy.
     */
    private ClubBoardMemberResponse buildResponse(
            ClubMembership membership,
            UserAccount user,
            ClubRole role,
            Semester semester
    ) {
        return new ClubBoardMemberResponse(
                membership.getMembershipID(),
                user != null ? user.getUserID() : null,
                user != null ? user.getFullName() : "Unknown",
                user != null ? user.getEmail() : "Unknown",
                role != null ? role.getRoleName() : "Unknown",
                semester.getSemesterID(),
                semester.getSemesterCode(),
                membership.getClubID()
        );
    }
}