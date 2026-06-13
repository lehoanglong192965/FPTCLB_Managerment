package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubBoardChangeRequest;
import com.fptu.fcms.dto.response.ClubBoardMemberResponse;
import com.fptu.fcms.entity.*;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClubBoardServiceImpl implements ClubBoardService {

    // NOTE BR-A02: Trong seed data hiện tại, clubRoleID = 1 tương ứng với vai trò Leader.
    // Khi bổ nhiệm Leader, hệ thống dùng ID này để kiểm tra sinh viên có đang làm Leader ở CLB khác không.
    private static final int CLUB_ROLE_ID_LEADER = 1;

    // NOTE BR-A05: SystemRole ICPDP là cán bộ quản lý/phòng IC-PDP.
    // Nhóm user này chỉ được quản lý hệ thống, không được tham gia CLB với role Member/Leader.
    private static final String SYSTEM_ROLE_ICPDP = "ICPDP";
    private static final String DISCIPLINE_ACTIVE = "Active";
    private static final String AUDIT_TABLE = "ClubMembership";

    private final ClubMembershipRepository membershipRepo;
    private final UserRepository userRepo;
    private final SystemRoleRepository systemRoleRepo;
    private final DisciplineLogRepository disciplineRepo;
    private final SemesterRepository semesterRepo;
    private final ClubRoleRepository clubRoleRepo;
    private final AuditLogRepository auditRepo;

    @Override
    @Transactional
    public ClubBoardMemberResponse changeBoardMember(
            Integer clubID,
            ClubBoardChangeRequest request,
            Integer actorID
    ) {
        Semester activeSemester = semesterRepo.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException(
                        "Hệ thống hiện không có học kỳ nào đang Active. " +
                                "Vui lòng kích hoạt học kỳ trước khi thay đổi ban điều hành.",
                        HttpStatus.CONFLICT
                ));

        UserAccount targetUser = userRepo.findById(request.getUserID())
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy user với ID: " + request.getUserID(),
                        HttpStatus.NOT_FOUND
                ));

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

        // NOTE BR-A05:
        // Chặn ngay từ đầu nếu người được thêm/cập nhật là ICPDP hoặc Admin.
        // Lý do đặt ở đây: áp dụng cho cả trường hợp thêm mới membership và cập nhật role.
        validateNotStaffAccount(targetUser, request.getAction());

        if ("APPOINT".equals(request.getAction())) {
            return handleAppoint(clubID, request, actorID, targetUser, activeSemester);
        } else {
            return handleDismiss(clubID, request, actorID, targetUser, activeSemester);
        }
    }

    private ClubBoardMemberResponse handleAppoint(
            Integer clubID,
            ClubBoardChangeRequest request,
            Integer actorID,
            UserAccount targetUser,
            Semester activeSemester
    ) {
        if (request.getNewRole() == null || request.getNewRole().isBlank()) {
            throw new BusinessRuleException(
                    "Vui lòng cung cấp newRole khi action = APPOINT " +
                            "(Leader / ViceLeader / Member)."
            );
        }

        ClubRole targetRole = clubRoleRepo.findByRoleNameAndIsDeletedFalse(request.getNewRole())
                .orElseThrow(() -> new BusinessRuleException(
                        "Vai trò CLB [" + request.getNewRole() + "] không tồn tại trong hệ thống.",
                        HttpStatus.BAD_REQUEST
                ));

        // NOTE: Xác định thao tác hiện tại có phải đang bổ nhiệm/cập nhật user lên Leader hay không.
        boolean isAppointingLeader = (targetRole.getClubRoleID() == CLUB_ROLE_ID_LEADER);

        if (isAppointingLeader) {
            // NOTE: Rule phụ đang có sẵn trong project: sinh viên có kỷ luật Active thì không được làm Leader.
            validateNoDiscipline(targetUser, activeSemester);

            // NOTE BR-A02:
            // Đây là điểm chặn chính: trước khi save DB, kiểm tra user có đang là Leader
            // ở CLB khác trong cùng học kỳ active hay không. Nếu có -> throw lỗi 422.
            validateNoLeaderInOtherClub(targetUser.getUserID(), activeSemester.getSemesterID(), clubID);

            // NOTE:
            // Sau khi chắc chắn user KHÔNG làm Leader ở CLB khác, hệ thống mới bãi nhiệm Leader cũ
            // của chính CLB hiện tại để đảm bảo mỗi CLB chỉ còn 1 Leader active.
            dismissCurrentLeader(clubID, activeSemester.getSemesterID(), actorID);
        }

        ClubMembership membership = membershipRepo
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        clubID, targetUser.getUserID(), activeSemester.getSemesterID()
                )
                .orElse(null);

        if (membership != null) {
            // NOTE CASE CẬP NHẬT CHỨC VỤ:
            // User đã có membership trong CLB này rồi -> chỉ update clubRoleID.
            // BR-A05 và BR-A02 đã được validate ở phía trên trước khi vào đoạn save này.
            String oldRoleInfo = "clubRoleID=" + membership.getClubRoleID();
            membership.setClubRoleID(targetRole.getClubRoleID());
            membershipRepo.save(membership);

            writeAuditLog(
                    actorID,
                    "UPDATE_CLUB_ROLE",
                    membership.getMembershipID(),
                    oldRoleInfo,
                    "clubRoleID=" + targetRole.getClubRoleID() + " (" + targetRole.getRoleName() + ")",
                    buildAuditReason(request, "Cập nhật vai trò CLB")
            );
        } else {
            // NOTE CASE THÊM MỚI THÀNH VIÊN:
            // User chưa có membership trong CLB/học kỳ hiện tại -> tạo mới bản ghi ClubMembership.
            // Nếu role là Leader, BR-A02 đã kiểm tra user chưa làm Leader ở CLB khác.
            // Nếu user là ICPDP/Admin, BR-A05 đã chặn trước đó.
            ClubMembership newMembership = new ClubMembership();
            newMembership.setClubID(clubID);
            newMembership.setUserID(targetUser.getUserID());
            newMembership.setSemesterID(activeSemester.getSemesterID());
            newMembership.setClubRoleID(targetRole.getClubRoleID());
            newMembership.setJoinedDate(LocalDate.now());
            newMembership.setIsDeleted(false);
            membership = membershipRepo.save(newMembership);

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

        return buildResponse(membership, targetUser, targetRole, activeSemester);
    }

    private ClubBoardMemberResponse handleDismiss(
            Integer clubID,
            ClubBoardChangeRequest request,
            Integer actorID,
            UserAccount targetUser,
            Semester activeSemester
    ) {
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

        ClubRole currentRole = clubRoleRepo.findById(membership.getClubRoleID())
                .orElse(null);

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

        membership.setIsDeleted(true);
        membershipRepo.save(membership);

        return buildResponse(membership, targetUser, currentRole, activeSemester);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClubBoardMemberResponse> getBoardMembers(Integer clubID) {
        Semester activeSemester = semesterRepo.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy học kỳ Active.",
                        HttpStatus.CONFLICT
                ));

        List<ClubMembership> memberships = membershipRepo
                .findBoardMembers(
                        clubID, activeSemester.getSemesterID()
                );

        return memberships.stream()
                .map(m -> {
                    UserAccount user = userRepo.findById(m.getUserID()).orElse(null);
                    ClubRole role = clubRoleRepo.findById(m.getClubRoleID()).orElse(null);
                    return buildResponse(m, user, role, activeSemester);
                })
                .collect(Collectors.toList());
    }

    /**
     * NOTE BR-A05 - Chặn cán bộ IC-PDP/Admin tham gia CLB.
     *
     * Áp dụng cho:
     * - Thêm mới membership với role Member/Leader/ViceLeader.
     * - Cập nhật chức vụ của một membership đã tồn tại.
     *
     * Vì đây là rule về tư cách tham gia CLB, nên kiểm tra bằng SystemRole của UserAccount.
     */
    private void validateNotStaffAccount(UserAccount user, String action) {
        SystemRole systemRole = systemRoleRepo.findById(user.getRoleID())
                .orElse(null);

        if (systemRole == null) {
            throw new BusinessRuleException(
                    "Tài khoản [" + user.getFullName() + "] không có System Role hợp lệ.",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        // NOTE BR-A05:
        // Nếu user thuộc phòng IC-PDP thì không cho có bất kỳ vai trò CLB nào.
        // Message này sẽ trả về Swagger để FE hiển thị rõ lý do bị chặn.
        if (SYSTEM_ROLE_ICPDP.equals(systemRole.getRoleName())) {
            throw new BusinessRuleException(
                    "[BR-02] Không thể thực hiện '" + action + "' cho tài khoản [" +
                            user.getFullName() + "] vì đây là cán bộ phòng IC-PDP. " +
                            "Cán bộ phòng ICPDP không được phép có vai trò Leader/Member trong CLB."
            );
        }

        // NOTE: Admin cũng là tài khoản quản trị hệ thống, không phải sinh viên tham gia CLB.
        // Nếu project của bạn cho Admin tham gia CLB thì có thể bỏ block này.
        if ("Admin".equals(systemRole.getRoleName())) {
            throw new BusinessRuleException(
                    "[BR-02] Không thể thực hiện '" + action + "' cho tài khoản [" +
                            user.getFullName() + "] vì đây là tài khoản Admin hệ thống. " +
                            "Tài khoản Admin không được phép có vai trò trong CLB."
            );
        }
    }

    private void validateNoDiscipline(UserAccount user, Semester activeSemester) {
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
     * NOTE BR-A02 - Chặn 1 sinh viên làm Leader ở 2 CLB cùng lúc/cùng học kỳ.
     *
     * Logic:
     * 1. Nhận userID, semesterID active, clubID hiện tại.
     * 2. Query bảng ClubMembership để tìm bản ghi active có:
     *    - cùng userID
     *    - cùng semesterID
     *    - clubRoleID = Leader
     *    - clubID khác CLB đang xử lý
     *    - isDeleted = false
     * 3. Nếu tồn tại -> ném BusinessRuleException để rollback transaction.
     */
    private void validateNoLeaderInOtherClub(Integer userID, Integer semesterID, Integer currentClubID) {
        boolean isLeaderElsewhere = membershipRepo.existsLeaderInOtherClub(
                userID, semesterID, CLUB_ROLE_ID_LEADER, currentClubID
        );

        if (isLeaderElsewhere) {
            // NOTE BR-A02: Đây là thông báo lỗi chính khi vi phạm rule Leader 2 CLB.
            throw new BusinessRuleException(
                    "[BR-03] Không thể bổ nhiệm Leader: sinh viên này đã đang giữ chức Leader " +
                            "tại một CLB khác trong học kỳ hiện tại. " +
                            "Một sinh viên chỉ được làm Leader của tối đa 1 CLB trong 1 học kỳ."
            );
        }
    }

    /**
     * NOTE: Tự động bãi nhiệm Leader cũ của CLB hiện tại.
     *
     * Hàm này KHÔNG dùng để xử lý BR-A02. BR-A02 đã được kiểm tra trước đó.
     * Hàm này chỉ đảm bảo trong cùng một CLB không có 2 Leader active sau khi bổ nhiệm Leader mới.
     */
    private void dismissCurrentLeader(Integer clubID, Integer semesterID, Integer actorID) {
        membershipRepo.findByClubIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                clubID, semesterID, CLUB_ROLE_ID_LEADER
        ).ifPresent(currentLeader -> {
            writeAuditLog(
                    actorID,
                    "AUTO_DISMISS_OLD_LEADER",
                    currentLeader.getMembershipID(),
                    "clubRoleID=" + CLUB_ROLE_ID_LEADER + " (Leader), userID=" + currentLeader.getUserID(),
                    "isDeleted=true (auto-dismissed do bổ nhiệm Leader mới)",
                    "Hệ thống tự động bãi nhiệm Leader cũ khi bổ nhiệm Leader mới"
            );

            currentLeader.setIsDeleted(true);
            membershipRepo.save(currentLeader);
        });
    }

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

    private String buildAuditReason(ClubBoardChangeRequest request, String defaultReason) {
        return (request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason()
                : defaultReason;
    }

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
