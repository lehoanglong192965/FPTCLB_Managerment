package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.*;

import com.fptu.fcms.dto.request.RecruitmentCycleRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentCycleResponseDTO;
import com.fptu.fcms.entity.RecruitmentCycle;
import com.fptu.fcms.repository.RecruitmentCycleRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.exception.BusinessRuleException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class RecruitmentCycleServiceImpl implements RecruitmentCycleService {

    private final RecruitmentCycleRepository cycleRepository;
    private final NotificationService notificationService;
    private final ClubMembershipRepository membershipRepository;
    private final ClubRepository clubRepository;
    private final SemesterRepository semesterRepository;

    @Override
    @Transactional
    public RecruitmentCycleResponseDTO createCycle(RecruitmentCycleRequestDTO dto) {
        Semester semester = resolveSemester(dto.getSemesterID());
        validateDates(dto.getStartDate(), dto.getEndDate());
        String status = normalizeStatus(dto.getStatus());
        if ("Open".equals(status) && cycleRepository
                .findFirstByClubIDIsNullAndSemesterIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        semester.getSemesterID(), "Open").isPresent()) {
            throw new BusinessRuleException("Học kỳ này đã có một mùa tuyển dụng đang mở.", HttpStatus.CONFLICT);
        }
        RecruitmentCycle c = new RecruitmentCycle();
        c.setSemesterID(semester.getSemesterID());
        c.setTitle(dto.getTitle());
        c.setQuestionsJson(dto.getQuestionsJson());
        c.setStartDate(dto.getStartDate());
        c.setStatus(status);
        c.setEndDate(dto.getEndDate());
        c.setCreatedAt(LocalDateTime.now());
        c.setIsDeleted(false);
        c.setReminded(false);
        c.setClosedAt("Closed".equals(c.getStatus()) ? LocalDateTime.now() : null);

        RecruitmentCycle saved = cycleRepository.save(c);
        return toDto(saved);
    }

    @Override
    @Transactional
    public RecruitmentCycleResponseDTO updateCycle(Integer id, RecruitmentCycleRequestDTO dto) {
        RecruitmentCycle existing = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));

        existing.setTitle(dto.getTitle());
        existing.setQuestionsJson(dto.getQuestionsJson());
        existing.setStartDate(dto.getStartDate());
        if (existing.getClubID() == null) {
            Semester semester = resolveSemester(dto.getSemesterID() != null ? dto.getSemesterID() : existing.getSemesterID());
            validateDates(dto.getStartDate(), dto.getEndDate());
            existing.setSemesterID(semester.getSemesterID());
            existing.setEndDate(dto.getEndDate());
        }
        if (dto.getStatus() != null) {
            String status = normalizeStatus(dto.getStatus());
            if (existing.getClubID() == null && "Open".equals(status)) {
                cycleRepository.findFirstByClubIDIsNullAndSemesterIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                                existing.getSemesterID(), "Open")
                        .filter(other -> !other.getCycleID().equals(existing.getCycleID()))
                        .ifPresent(other -> {
                            throw new BusinessRuleException("Học kỳ này đã có một mùa tuyển dụng đang mở.", HttpStatus.CONFLICT);
                        });
            }
            existing.setStatus(status);
            existing.setClosedAt("Closed".equals(status) ? LocalDateTime.now() : null);
            if (existing.getClubID() == null && "Closed".equals(status)) {
                LocalDateTime closedAt = LocalDateTime.now();
                cycleRepository.findByParentCycleIDAndIsDeletedFalseOrderByCreatedAtDesc(existing.getCycleID())
                        .stream().filter(child -> "Open".equals(child.getStatus())).forEach(child -> {
                            child.setStatus("Closed");
                            child.setClosedAt(closedAt);
                            cycleRepository.save(child);
                        });
            }
        }

        RecruitmentCycle updated = cycleRepository.save(existing);
        return toDto(updated);
    }

    @Override
    public RecruitmentCycleResponseDTO getCycleById(Integer id) {
        RecruitmentCycle c = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));
        return toDto(c);
    }

    @Override
    public List<RecruitmentCycleResponseDTO> getAllCycles() {
        return cycleRepository.findByClubIDIsNullAndIsDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void softDeleteCycle(Integer id) {
        RecruitmentCycle c = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));
        c.setIsDeleted(true);
        cycleRepository.save(c);
    }

    @Override
    @Transactional
    public void triggerReminderForCycle(Integer id) {
        RecruitmentCycle c = cycleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment cycle not found"));
        notificationService.notifyAdminCloseOrExtend(c);
        c.setReminded(true);
        cycleRepository.save(c);
    }

    @Override
    public List<RecruitmentCycleResponseDTO> getClubCycles(Integer clubId, UserPrincipal currentUser) {
        requireClubManagementAccess(clubId, currentUser);
        return cycleRepository.findByClubIDAndIsDeletedFalseOrderByCreatedAtDesc(clubId)
                .stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public RecruitmentCycleResponseDTO createClubCycle(
            Integer clubId, RecruitmentCycleRequestDTO dto, UserPrincipal currentUser) {
        requireClubManagementAccess(clubId, currentUser);
        clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy câu lạc bộ.", HttpStatus.NOT_FOUND));

        String requestedStatus = normalizeStatus(dto.getStatus());
        if ("Open".equals(requestedStatus)
                && cycleRepository.findFirstByClubIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(clubId, "Open").isPresent()) {
            throw new BusinessRuleException("Câu lạc bộ đang có một đợt tuyển thành viên mở.", HttpStatus.CONFLICT);
        }

        Semester activeSemester = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy học kỳ đang hoạt động.", HttpStatus.CONFLICT));
        RecruitmentCycle season = cycleRepository
                .findFirstByClubIDIsNullAndSemesterIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        activeSemester.getSemesterID(), "Open")
                .filter(item -> !item.getStartDate().isAfter(java.time.LocalDate.now()))
                .filter(item -> item.getEndDate() == null || !item.getEndDate().isBefore(java.time.LocalDate.now()))
                .orElseThrow(() -> new BusinessRuleException(
                        "ICPDP chưa mở mùa tuyển dụng cho học kỳ hiện tại.", HttpStatus.CONFLICT));
        if (cycleRepository.existsByParentCycleIDAndClubIDAndIsDeletedFalse(season.getCycleID(), clubId)) {
            throw new BusinessRuleException("CLB đã có đợt tuyển trong mùa tuyển dụng này.", HttpStatus.CONFLICT);
        }

        RecruitmentCycle cycle = new RecruitmentCycle();
        cycle.setClubID(clubId);
        cycle.setParentCycleID(season.getCycleID());
        cycle.setSemesterID(activeSemester.getSemesterID());
        cycle.setTitle(dto.getTitle().trim());
        cycle.setQuestionsJson(dto.getQuestionsJson());
        cycle.setStartDate(dto.getStartDate());
        cycle.setEndDate(season.getEndDate());
        cycle.setStatus(requestedStatus);
        cycle.setCreatedAt(LocalDateTime.now());
        cycle.setClosedAt("Closed".equals(requestedStatus) ? LocalDateTime.now() : null);
        cycle.setIsDeleted(false);
        cycle.setReminded(false);
        return toDto(cycleRepository.save(cycle));
    }

    @Override
    @Transactional
    public RecruitmentCycleResponseDTO changeClubCycleStatus(
            Integer id, String status, UserPrincipal currentUser) {
        RecruitmentCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy đợt tuyển thành viên.", HttpStatus.NOT_FOUND));
        if (cycle.getClubID() == null) {
            throw new BusinessRuleException("Đợt tuyển toàn hệ thống chỉ ICPDP/Admin được quản lý.", HttpStatus.FORBIDDEN);
        }
        requireClubManagementAccess(cycle.getClubID(), currentUser);
        String normalized = normalizeStatus(status);
        if (normalized.equals(cycle.getStatus())) return toDto(cycle);

        if ("Open".equals(normalized)) {
            RecruitmentCycle season = cycle.getParentCycleID() == null ? null
                    : cycleRepository.findById(cycle.getParentCycleID()).orElse(null);
            if (season == null || !"Open".equals(season.getStatus())) {
                throw new BusinessRuleException("Mùa tuyển dụng của ICPDP hiện không mở.", HttpStatus.CONFLICT);
            }
            cycleRepository.findFirstByClubIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(cycle.getClubID(), "Open")
                    .filter(other -> !other.getCycleID().equals(id))
                    .ifPresent(other -> {
                        throw new BusinessRuleException("Câu lạc bộ đang có một đợt tuyển thành viên mở.", HttpStatus.CONFLICT);
                    });
            cycle.setClosedAt(null);
        } else if ("Closed".equals(normalized)) {
            cycle.setClosedAt(LocalDateTime.now());
        } else {
            cycle.setClosedAt(null);
        }
        cycle.setStatus(normalized);
        return toDto(cycleRepository.save(cycle));
    }

    @Override
    public List<RecruitmentCycleResponseDTO> getSeasonClubCycles(Integer seasonId, UserPrincipal currentUser) {
        requireSystemManager(currentUser);
        RecruitmentCycle season = cycleRepository.findById(seasonId)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy mùa tuyển dụng.", HttpStatus.NOT_FOUND));
        if (season.getClubID() != null) {
            throw new BusinessRuleException("Đây không phải mùa tuyển dụng cấp hệ thống.", HttpStatus.BAD_REQUEST);
        }
        return cycleRepository.findByParentCycleIDAndIsDeletedFalseOrderByCreatedAtDesc(seasonId)
                .stream().map(this::toDto).toList();
    }

    private Semester resolveSemester(Integer semesterId) {
        if (semesterId != null) {
            return semesterRepository.findById(semesterId)
                    .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                    .orElseThrow(() -> new BusinessRuleException("Không tìm thấy học kỳ.", HttpStatus.NOT_FOUND));
        }
        return semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy học kỳ đang hoạt động.", HttpStatus.CONFLICT));
    }

    private void validateDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessRuleException("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.", HttpStatus.BAD_REQUEST);
        }
    }

    private void requireSystemManager(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getAuthorities() == null) {
            throw new BusinessRuleException("Bạn cần đăng nhập.", HttpStatus.UNAUTHORIZED);
        }
        boolean allowed = currentUser.getAuthorities().stream().map(a -> a.getAuthority())
                .anyMatch(role -> "ROLE_Admin".equals(role) || "ROLE_ICPDP".equals(role));
        if (!allowed) throw new BusinessRuleException("Chỉ ICPDP/Admin được quản lý mùa tuyển dụng.", HttpStatus.FORBIDDEN);
    }

    private String normalizeStatus(String status) {
        if (status == null) return "Open";
        if ("Open".equalsIgnoreCase(status)) return "Open";
        if ("Closed".equalsIgnoreCase(status)) return "Closed";
        if ("Draft".equalsIgnoreCase(status)) return "Draft";
        throw new BusinessRuleException("Trạng thái chỉ được là Open, Closed hoặc Draft.", HttpStatus.BAD_REQUEST);
    }

    private void requireClubManagementAccess(Integer clubId, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException("Bạn cần đăng nhập.", HttpStatus.UNAUTHORIZED);
        }
        Set<String> authorities = currentUser.getAuthorities().stream()
                .map(authority -> authority.getAuthority()).collect(java.util.stream.Collectors.toSet());
        if (authorities.contains("ROLE_Admin") || authorities.contains("ROLE_ICPDP")) return;
        boolean boardMember = membershipRepository.existsActiveMembershipByClubUserAndRoleNames(
                clubId, currentUser.getUserId(), List.of("Leader", "ViceLeader"));
        if (!boardMember) {
            throw new BusinessRuleException("Bạn không có quyền quản lý tuyển thành viên của CLB này.", HttpStatus.FORBIDDEN);
        }
    }

    private RecruitmentCycleResponseDTO toDto(RecruitmentCycle c) {
        RecruitmentCycleResponseDTO dto = new RecruitmentCycleResponseDTO();
        dto.setCycleID(c.getCycleID());
        dto.setClubID(c.getClubID());
        dto.setParentCycleID(c.getParentCycleID());
        dto.setSemesterID(c.getSemesterID());
        dto.setEndDate(c.getEndDate());
        if (c.getClubID() != null) {
            clubRepository.findByClubIDAndIsDeletedFalse(c.getClubID())
                    .ifPresent(club -> dto.setClubName(club.getClubName()));
        }
        if (c.getSemesterID() != null) {
            semesterRepository.findById(c.getSemesterID())
                    .ifPresent(semester -> dto.setSemesterCode(semester.getSemesterCode()));
        }
        dto.setTitle(c.getTitle());
        dto.setQuestionsJson(c.getQuestionsJson());
        dto.setStatus(c.getStatus());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setStartDate(c.getStartDate());
        dto.setClosedAt(c.getClosedAt());
        dto.setReminded(c.getReminded());
        return dto;
    }
}

