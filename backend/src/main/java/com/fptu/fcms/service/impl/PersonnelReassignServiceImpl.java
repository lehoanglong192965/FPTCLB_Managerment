package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.ClubBoardChangeRequest;
import com.fptu.fcms.dto.request.PersonnelReassignRequest;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.PersonnelReassignLog;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.PersonnelReassignLogRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.ClubBoardService;
import com.fptu.fcms.service.PersonnelReassignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Điều động nhân sự khẩn cấp (IC-PDP): thay Trưởng / Phó Trưởng CLB giữa kỳ.
 *
 * Tái sử dụng ClubBoardService.changeBoardMember cho toàn bộ business rule
 * (BR-A02, BR-A05, kỷ luật Active, tự bãi nhiệm Leader cũ, ghi AuditLog),
 * đồng thời lưu thêm PersonnelReassignLog để trang lịch sử hiển thị lâu dài.
 */
@Service
@RequiredArgsConstructor
public class PersonnelReassignServiceImpl implements PersonnelReassignService {

    private static final String POSITION_LEADER = "leader";

    private final ClubBoardService clubBoardService;
    private final PersonnelReassignLogRepository reassignLogRepo;
    private final ClubRepository clubRepo;
    private final ClubRoleRepository clubRoleRepo;
    private final ClubMembershipRepository membershipRepo;
    private final SemesterRepository semesterRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional
    public PersonnelReassignLog reassign(PersonnelReassignRequest request, Integer actorID) {
        boolean isLeader = POSITION_LEADER.equalsIgnoreCase(request.getPosition());
        String newRoleName = isLeader ? "Leader" : "ViceLeader";

        Semester activeSemester = semesterRepo.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy học kỳ Active.", HttpStatus.CONFLICT));

        Club club = clubRepo.findById(request.getClubID())
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy CLB với ID: " + request.getClubID(), HttpStatus.NOT_FOUND));

        UserAccount toUser = userRepo.findByUserIDAndIsDeletedFalse(request.getNewUserID())
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy người được điều động.", HttpStatus.NOT_FOUND));

        ClubRole targetRole = clubRoleRepo.findByRoleNameAndIsDeletedFalse(newRoleName)
                .orElseThrow(() -> new BusinessRuleException(
                        "Vai trò [" + newRoleName + "] không tồn tại.", HttpStatus.CONFLICT));

        // Người đang giữ vị trí hiện tại (nếu có) — để ghi lịch sử và bãi nhiệm
        Optional<ClubMembership> currentHolder = membershipRepo
                .findByClubIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                        request.getClubID(), activeSemester.getSemesterID(), targetRole.getClubRoleID());
        UserAccount fromUser = currentHolder
                .flatMap(m -> userRepo.findByUserIDAndIsDeletedFalse(m.getUserID()))
                .orElse(null);

        if (fromUser != null && fromUser.getUserID().equals(toUser.getUserID())) {
            throw new BusinessRuleException(
                    "[" + toUser.getFullName() + "] đang giữ vị trí này rồi, không cần điều động.",
                    HttpStatus.BAD_REQUEST);
        }

        // Với Phó Trưởng CLB: bãi nhiệm người cũ trước (changeBoardMember chỉ tự
        // bãi nhiệm Leader cũ khi bổ nhiệm Leader mới). Cùng transaction — lỗi ở
        // bước sau sẽ rollback toàn bộ.
        if (!isLeader && fromUser != null) {
            ClubBoardChangeRequest dismiss = new ClubBoardChangeRequest();
            dismiss.setUserID(fromUser.getUserID());
            dismiss.setAction("DISMISS");
            dismiss.setReason("[Điều động khẩn cấp] " + request.getReason());
            clubBoardService.changeBoardMember(request.getClubID(), dismiss, actorID);
        }

        ClubBoardChangeRequest appoint = new ClubBoardChangeRequest();
        appoint.setUserID(toUser.getUserID());
        appoint.setAction("APPOINT");
        appoint.setNewRole(newRoleName);
        appoint.setReason("[Điều động khẩn cấp] " + request.getReason());
        clubBoardService.changeBoardMember(request.getClubID(), appoint, actorID);

        String actorName = userRepo.findByUserIDAndIsDeletedFalse(actorID)
                .map(UserAccount::getFullName)
                .orElse("IC-PDP");

        PersonnelReassignLog log = new PersonnelReassignLog();
        log.setClubID(club.getClubID());
        log.setClubName(club.getClubName());
        log.setPosition(isLeader ? "leader" : "vice");
        log.setLevel(request.getLevel());
        log.setFromUserID(fromUser != null ? fromUser.getUserID() : null);
        log.setFromName(fromUser != null ? fromUser.getFullName() : null);
        log.setToUserID(toUser.getUserID());
        log.setToName(toUser.getFullName());
        log.setReason(request.getReason());
        log.setActorID(actorID);
        log.setActorName(actorName);
        return reassignLogRepo.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonnelReassignLog> getHistory() {
        return reassignLogRepo.findAllByOrderByCreatedAtDesc();
    }
}