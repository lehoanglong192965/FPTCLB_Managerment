package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.*;

import com.fptu.fcms.dto.DisciplineLogDTO;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.DisciplineLog;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisciplineLogServiceImpl implements DisciplineLogService {

    private final DisciplineLogRepository disciplineLogRepository;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;

    private static final String DISCIPLINE_STATUS_ACTIVE = "Active";
    private static final String CLUB_ROLE_LEADER = "Leader";
    private static final String CLUB_ROLE_MEMBER = "Member";
    private static final String USER_STATUS_SUSPENDED = "Suspended";

    @Override
    @Transactional(readOnly = true)
    public List<DisciplineLogDTO> getAllDisciplineLogs() {
        return disciplineLogRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DisciplineLogDTO getDisciplineLogById(Integer id) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));
        return mapToDTO(log);
    }

    // Method cũ gọi qua method mới, actorID = null
    @Override
    @Transactional
    public DisciplineLogDTO createDisciplineLog(DisciplineLogDTO dto) {
        return createDisciplineLog(dto, null);
    }

    // Method mới: có actorID từ Admin/ICPDP đang login
    @Override
    @Transactional
    public DisciplineLogDTO createDisciplineLog(DisciplineLogDTO dto, Integer actorID) {
        validateReferences(dto.getUserID(), dto.getSemesterID());

        DisciplineLog log = new DisciplineLog();
        log.setUserID(dto.getUserID());
        log.setSemesterID(dto.getSemesterID());
        log.setReason(dto.getReason());
        log.setDisciplineStatus(dto.getDisciplineStatus());
        log.setCreatedAt(LocalDateTime.now());
        log.setIsDeleted(false);

        log = disciplineLogRepository.save(log);

        // Nếu status = Active thì hạ Leader xuống Member ngay
        applyDisciplineSideEffectsIfActive(log);

        return mapToDTO(log);
    }

    // Method cũ gọi qua method mới, actorID = null
    @Override
    @Transactional
    public DisciplineLogDTO updateDisciplineLog(Integer id, DisciplineLogDTO dto) {
        return updateDisciplineLog(id, dto, null);
    }

    // Method mới: update sang Active cũng hạ Leader xuống Member
    @Override
    @Transactional
    public DisciplineLogDTO updateDisciplineLog(Integer id, DisciplineLogDTO dto, Integer actorID) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));

        log.setReason(dto.getReason());
        log.setDisciplineStatus(dto.getDisciplineStatus());

        log = disciplineLogRepository.save(log);

        // Nếu status = Active thì hạ Leader xuống Member ngay
        applyDisciplineSideEffectsIfActive(log);

        return mapToDTO(log);
    }

    @Override
    @Transactional
    public void deleteDisciplineLog(Integer id) {
        DisciplineLog log = disciplineLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DisciplineLog not found"));

        log.setIsDeleted(true);
        disciplineLogRepository.save(log);
    }

    private void applyDisciplineSideEffectsIfActive(DisciplineLog log) {
        // Chỉ xử lý khi kỷ luật Active
        if (!DISCIPLINE_STATUS_ACTIVE.equalsIgnoreCase(log.getDisciplineStatus())) {
            return;
        }

        // Lấy role Leader từ DB
        ClubRole leaderRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse(CLUB_ROLE_LEADER)
                .orElseThrow(() -> new IllegalStateException("ClubRole Leader not found"));

        // Lấy role Member từ DB
        ClubRole memberRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse(CLUB_ROLE_MEMBER)
                .orElseThrow(() -> new IllegalStateException("ClubRole Member not found"));

        // Tìm tất cả CLB mà user này đang là Leader trong học kỳ bị kỷ luật
        List<ClubMembership> leaderMemberships =
                clubMembershipRepository.findActiveLeaderMembershipsByUserAndSemester(
                        log.getUserID(),
                        log.getSemesterID(),
                        leaderRole.getClubRoleID()
                );

        // Hạ Leader xuống Member
        for (ClubMembership membership : leaderMemberships) {
            membership.setClubRoleID(memberRole.getClubRoleID());
            clubMembershipRepository.save(membership);
        }

        // Đình chỉ tài khoản
        UserAccount user = userRepository.findById(log.getUserID())
                .orElseThrow(() -> new IllegalArgumentException("Invalid User reference"));

        user.setAccountStatus(USER_STATUS_SUSPENDED);
        userRepository.save(user);
    }

    private void validateReferences(Integer userID, Integer semesterID) {
        if (!userRepository.existsById(userID)) {
            throw new IllegalArgumentException("Invalid User reference");
        }
        if (!semesterRepository.existsById(semesterID)) {
            throw new IllegalArgumentException("Invalid Semester reference");
        }
    }

    private DisciplineLogDTO mapToDTO(DisciplineLog entity) {
        DisciplineLogDTO dto = new DisciplineLogDTO();
        dto.setDisciplineID(entity.getDisciplineID());
        dto.setUserID(entity.getUserID());
        dto.setSemesterID(entity.getSemesterID());
        dto.setReason(entity.getReason());
        dto.setDisciplineStatus(entity.getDisciplineStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}