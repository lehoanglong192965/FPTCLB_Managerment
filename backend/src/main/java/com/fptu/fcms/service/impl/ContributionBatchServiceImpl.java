package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.AppealCreateRequest;
import com.fptu.fcms.dto.request.AppealResolveRequest;
import com.fptu.fcms.dto.response.AppealResponse;
import com.fptu.fcms.dto.response.ContributionBatchResponse;
import com.fptu.fcms.dto.response.ContributionDTO;
import com.fptu.fcms.entity.Appeal;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Contribution;
import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.MemberPerformance;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.AppealStatus;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.AppealRepository;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ContributionBatchRepository;
import com.fptu.fcms.repository.ContributionRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.MemberPerformanceRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.ContributionBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContributionBatchServiceImpl implements ContributionBatchService {

    private static final EventStatus STATUS_REPORT_UPLOADED = EventStatus.REPORT_UPLOADED;
    private static final EventStatus STATUS_CONTRIBUTION_SCORING = EventStatus.CONTRIBUTION_SCORING;
    private static final EventStatus STATUS_CONTRIBUTION_FINALIZED = EventStatus.CONTRIBUTION_FINALIZED;
    private static final RegistrationStatus REGISTRATION_STATUS_CONFIRMED = RegistrationStatus.CONFIRMED;
    private static final RegistrationStatus REGISTRATION_STATUS_REGISTERED = RegistrationStatus.REGISTERED;
    private static final String CONTRIBUTION_STATUS_DRAFT = "DRAFT";
    private static final String CONTRIBUTION_STATUS_FINALIZED = "FINALIZED";
    private static final String CONTRIBUTION_TYPE_ABSENT = "ABSENT";
    private static final String LEADER_EVALUATION_GOOD = "GOOD";
    private static final String LEADER_EVALUATION_NOT_GOOD = "NOT_GOOD";
    private static final int NOT_GOOD_PENALTY_POINTS = 10;
    private static final int REGISTERED_MEMBER_BASE_POINTS = 100;
    private static final int CLUB_ROLE_MEMBER_ID = 3;

    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final ContributionBatchRepository contributionBatchRepository;
    private final ContributionRepository contributionRepository;
    private final AppealRepository appealRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final UserRepository userRepository;
    private final MemberPerformanceRepository memberPerformanceRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public ContributionBatchResponse approveReportAndCreateBatch(Integer eventId, Integer actorId) {
        Event event = findEvent(eventId);
        if (!STATUS_REPORT_UPLOADED.equals(event.getEventStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EVENT_REPORT_NOT_UPLOADED");
        }
        if (!eventReportRepository.existsByEventIDAndIsDeletedFalse(eventId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_REPORT_NOT_FOUND");
        }

        LocalDateTime now = LocalDateTime.now();
        ContributionBatch batch = contributionBatchRepository.findByEventIDAndIsDeletedFalse(eventId).orElse(null);
        if (batch == null) {
            batch = new ContributionBatch();
            batch.setEventID(eventId);
            batch.setClubID(event.getClubID());
            batch.setSemesterID(event.getSemesterID());
            batch.setStatus(ContributionBatchStatus.SCORING);
            batch.setReportApprovedBy(actorId);
            batch.setReportApprovedAt(now);
            batch.setScoringOpenedAt(now);
            batch.setCreatedAt(now);
            batch.setUpdatedAt(now);
            batch.setIsDeleted(false);
            batch = contributionBatchRepository.save(batch);
        }

        event.setEventStatus(STATUS_CONTRIBUTION_SCORING);
        eventRepository.save(event);
        auditLogService.record(actorId, "ContributionBatch", batch.getBatchID(), "REPORT_APPROVED_BATCH_CREATED", null, batch.getStatus(), "ICPDP approved report and opened contribution scoring");
        return toBatchResponse(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public ContributionBatchResponse getBatchByEvent(Integer eventId) {
        return toBatchResponse(findBatchByEvent(eventId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContributionDTO> getContributionScores(Integer eventId) {
        Event event = findEvent(eventId);
        ContributionBatch batch = findBatchByEvent(eventId);
        Set<Integer> scoringMemberUserIds = getScoringMemberUserIds(event);
        Map<Integer, Contribution> savedByUser = contributionRepository.findByBatchIDAndUserIDInAndIsDeletedFalse(batch.getBatchID(), scoringMemberUserIds)
                .stream()
                .collect(Collectors.toMap(Contribution::getUserID, Function.identity(), (a, b) -> a));
        List<EventRegistration> registrations = eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        List<EventAssignment> assignments = eventAssignmentRepository.findByEventIDAndIsDeletedFalse(eventId);
        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId).orElse(null);
        List<AttendanceRecord> attendanceRecords = session == null ? List.of() : attendanceRecordRepository.findBySessionID(session.getSessionID());

        return registrations.stream()
                .filter(reg -> reg.getUserID() != null)
                .filter(reg -> scoringMemberUserIds.contains(reg.getUserID()))
                .filter(this::isConfirmedRegistration)
                .map(reg -> toContributionDto(reg, savedByUser.get(reg.getUserID()), assignments, attendanceRecords))
                .toList();
    }

    @Override
    @Transactional
    public ContributionBatchResponse saveContributionScores(Integer eventId, List<ContributionDTO> contributions, Integer actorId) {
        Event event = findEvent(eventId);
        ContributionBatch batch = findBatchByEvent(eventId);
        if (batch.getStatus() != ContributionBatchStatus.SCORING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRIBUTION_BATCH_NOT_SCORING");
        }

        Set<Integer> scoringMemberUserIds = getScoringMemberUserIds(event);
        LocalDateTime now = LocalDateTime.now();
        for (ContributionDTO dto : contributions == null ? List.<ContributionDTO>of() : contributions) {
            Integer userId = dto.getUserID();
            if (userId == null || !scoringMemberUserIds.contains(userId)) {
                continue;
            }
            String type = normalizeContributionType(dto.getContributionType());
            String leaderEvaluation = normalizeLeaderEvaluation(dto.getLeaderEvaluation());
            if (!StringUtils.hasText(type) && !StringUtils.hasText(leaderEvaluation)) {
                continue;
            }
            Contribution contribution = contributionRepository.findByBatchIDAndUserIDAndIsDeletedFalse(batch.getBatchID(), userId)
                    .orElseGet(Contribution::new);
            applyScore(event, batch, contribution, userId, type, leaderEvaluation, actorId, CONTRIBUTION_STATUS_DRAFT, now);
            contributionRepository.save(contribution);
        }

        batch.setScoringSubmittedAt(now);
        batch.setScoringSubmittedBy(actorId);
        batch.setUpdatedAt(now);
        ContributionBatch saved = contributionBatchRepository.save(batch);
        auditLogService.record(actorId, "ContributionBatch", saved.getBatchID(), "CONTRIBUTION_SCORES_SAVED", null, saved.getStatus(), "Leader saved contribution scores");
        return toBatchResponse(saved);
    }

    @Override
    @Transactional
    public ContributionBatchResponse openAppealWindow(Integer eventId, Integer actorId) {
        ContributionBatch batch = findBatchByEvent(eventId);
        if (batch.getStatus() != ContributionBatchStatus.SCORING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRIBUTION_BATCH_NOT_SCORING");
        }
        if (contributionRepository.findByBatchIDAndIsDeletedFalse(batch.getBatchID()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRIBUTION_SCORES_REQUIRED");
        }
        LocalDateTime now = LocalDateTime.now();
        batch.setStatus(ContributionBatchStatus.APPEAL_OPEN);
        batch.setAppealOpenedAt(now);
        batch.setAppealClosesAt(now.plusHours(24));
        batch.setUpdatedAt(now);
        ContributionBatch saved = contributionBatchRepository.save(batch);
        auditLogService.record(actorId, "ContributionBatch", saved.getBatchID(), "CONTRIBUTION_APPEAL_OPENED", null, saved.getStatus(), "Opened 24-hour appeal window");
        return toBatchResponse(saved);
    }

    @Override
    @Transactional
    public AppealResponse createAppeal(Integer batchId, AppealCreateRequest request, Integer userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED");
        }
        ContributionBatch batch = contributionBatchRepository.findByBatchIDAndIsDeletedFalse(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_BATCH_NOT_FOUND"));
        LocalDateTime now = LocalDateTime.now();
        if (batch.getStatus() != ContributionBatchStatus.APPEAL_OPEN || batch.getAppealClosesAt() == null || !now.isBefore(batch.getAppealClosesAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEAL_WINDOW_CLOSED");
        }
        Contribution contribution = contributionRepository.findByBatchIDAndUserIDAndIsDeletedFalse(batchId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "CONTRIBUTION_SCORE_NOT_FOUND"));
        if (appealRepository.existsByBatchIDAndUserIDAndStatusAndIsDeletedFalse(batchId, userId, AppealStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEAL_ALREADY_PENDING");
        }

        Appeal appeal = new Appeal();
        appeal.setBatchID(batchId);
        appeal.setEventID(batch.getEventID());
        appeal.setContributionID(contribution.getContributionID());
        appeal.setUserID(userId);
        appeal.setReason(request.getReason().trim());
        appeal.setStatus(AppealStatus.PENDING);
        appeal.setRequestedAt(now);
        appeal.setIsDeleted(false);
        return toAppealResponse(appealRepository.save(appeal));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppealResponse> getAppeals(Integer batchId) {
        return appealRepository.findByBatchIDAndIsDeletedFalse(batchId).stream()
                .map(this::toAppealResponse)
                .toList();
    }

    @Override
    @Transactional
    public AppealResponse resolveAppeal(Integer appealId, AppealResolveRequest request, Integer actorId) {
        Appeal appeal = appealRepository.findByAppealIDAndIsDeletedFalse(appealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "APPEAL_NOT_FOUND"));
        if (appeal.getStatus() != AppealStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEAL_ALREADY_RESOLVED");
        }
        ContributionBatch batch = contributionBatchRepository.findByBatchIDAndIsDeletedFalse(appeal.getBatchID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_BATCH_NOT_FOUND"));
        if (batch.getStatus() != ContributionBatchStatus.APPEAL_OPEN && batch.getStatus() != ContributionBatchStatus.APPEAL_RESOLUTION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRIBUTION_BATCH_NOT_IN_APPEAL");
        }

        AppealStatus status = parseResolveStatus(request.getStatus());
        if (status == AppealStatus.APPROVED) {
            Contribution contribution = contributionRepository.findById(appeal.getContributionID())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_SCORE_NOT_FOUND"));
            String type = StringUtils.hasText(request.getContributionType())
                    ? normalizeContributionType(request.getContributionType())
                    : contribution.getContributionType();
            String leaderEvaluation = StringUtils.hasText(request.getLeaderEvaluation())
                    ? normalizeLeaderEvaluation(request.getLeaderEvaluation())
                    : contribution.getLeaderEvaluation();
            Event event = findEvent(batch.getEventID());
            applyScore(event, batch, contribution, appeal.getUserID(), type, leaderEvaluation, actorId, CONTRIBUTION_STATUS_DRAFT, LocalDateTime.now());
            contributionRepository.save(contribution);
        }

        appeal.setStatus(status);
        appeal.setResolutionNote(request.getResolutionNote());
        appeal.setResolvedAt(LocalDateTime.now());
        appeal.setResolvedBy(actorId);
        Appeal saved = appealRepository.save(appeal);
        if (!appealRepository.existsByBatchIDAndStatusAndIsDeletedFalse(batch.getBatchID(), AppealStatus.PENDING)) {
            batch.setStatus(ContributionBatchStatus.APPEAL_RESOLUTION);
            batch.setUpdatedAt(LocalDateTime.now());
            contributionBatchRepository.save(batch);
        }
        auditLogService.record(actorId, "Appeal", saved.getAppealID(), "CONTRIBUTION_APPEAL_RESOLVED", null, saved.getStatus(), request.getResolutionNote());
        return toAppealResponse(saved);
    }

    @Override
    @Transactional
    public ContributionBatchResponse finalizeBatch(Integer eventId, Integer actorId) {
        Event event = findEvent(eventId);
        ContributionBatch batch = findBatchByEvent(eventId);
        if (batch.getStatus() == ContributionBatchStatus.FINALIZED) {
            return toBatchResponse(batch);
        }
        LocalDateTime now = LocalDateTime.now();
        if (batch.getAppealClosesAt() == null || now.isBefore(batch.getAppealClosesAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEAL_WINDOW_NOT_CLOSED");
        }
        if (appealRepository.existsByBatchIDAndStatusAndIsDeletedFalse(batch.getBatchID(), AppealStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEALS_PENDING");
        }

        List<Contribution> contributions = contributionRepository.findByBatchIDAndIsDeletedFalse(batch.getBatchID());
        if (contributions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRIBUTION_SCORES_REQUIRED");
        }
        for (Contribution contribution : contributions) {
            if (contribution.getUserID() == null) {
                continue;
            }
            MemberPerformance performance = memberPerformanceRepository
                    .findByEventIDAndUserIDAndIsDeletedFalse(eventId, contribution.getUserID())
                    .orElseGet(MemberPerformance::new);
            performance.setClubID(event.getClubID());
            performance.setEventID(eventId);
            performance.setUserID(contribution.getUserID());
            performance.setBasePoints(contribution.getBasePoints());
            performance.setBonusPoints(contribution.getBonusPoints());
            performance.setLeaderEvaluation(contribution.getLeaderEvaluation());
            performance.setPenaltyPoints(contribution.getPenaltyPoints());
            performance.setUpdatedAt(now);
            performance.setIsDeleted(false);
            memberPerformanceRepository.save(performance);

            contribution.setStatus(CONTRIBUTION_STATUS_FINALIZED);
            contribution.setCalculatedAt(now);
            contribution.setUpdatedAt(now);
            contributionRepository.save(contribution);
        }

        batch.setStatus(ContributionBatchStatus.FINALIZED);
        batch.setFinalizedAt(now);
        batch.setFinalizedBy(actorId);
        batch.setUpdatedAt(now);
        ContributionBatch saved = contributionBatchRepository.save(batch);
        event.setEventStatus(STATUS_CONTRIBUTION_FINALIZED);
        eventRepository.save(event);
        auditLogService.record(actorId, "ContributionBatch", saved.getBatchID(), "CONTRIBUTION_BATCH_FINALIZED", null, saved.getStatus(), "Finalized contributions into MemberPerformance");
        return toBatchResponse(saved);
    }

    private ContributionDTO toContributionDto(
            EventRegistration registration,
            Contribution saved,
            List<EventAssignment> assignments,
            List<AttendanceRecord> attendanceRecords
    ) {
        Integer userId = registration.getUserID();
        String userName = userRepository.findById(userId).map(UserAccount::getFullName).orElse("Unknown");
        String type = saved != null && StringUtils.hasText(saved.getContributionType())
                ? saved.getContributionType()
                : resolveDefaultContributionType(userId, assignments, attendanceRecords);
        String leaderEvaluation = saved == null ? "" : nullToBlank(saved.getLeaderEvaluation());
        return new ContributionDTO(userId, userName, nullToBlank(type), leaderEvaluation);
    }

    private String resolveDefaultContributionType(Integer userId, List<EventAssignment> assignments, List<AttendanceRecord> attendanceRecords) {
        return assignments.stream()
                .filter(a -> Objects.equals(a.getUserID(), userId))
                .findFirst()
                .map(a -> a.getEventRoleID() != null && a.getEventRoleID() == 1 ? "CORE_TEAM" : "SUPPORT_ORGANIZER")
                .orElseGet(() -> {
                    AttendanceRecord record = attendanceRecords.stream()
                            .filter(ar -> Objects.equals(ar.getUserID(), userId))
                            .findFirst()
                            .orElse(null);
                    if (record == null || record.getAttendanceStatus() == null) {
                        return "";
                    }
                    return isPresent(record.getAttendanceStatus()) ? "PARTICIPANT" : CONTRIBUTION_TYPE_ABSENT;
                });
    }

    private void applyScore(
            Event event,
            ContributionBatch batch,
            Contribution contribution,
            Integer userId,
            String contributionType,
            String leaderEvaluation,
            Integer actorId,
            String status,
            LocalDateTime now
    ) {
        int basePoints = resolveContributionBasePoints(batch.getEventID(), userId);
        int bonusPoints = calculateScore(contributionType);
        int penaltyPoints = LEADER_EVALUATION_NOT_GOOD.equals(leaderEvaluation) ? NOT_GOOD_PENALTY_POINTS : 0;
        contribution.setBatchID(batch.getBatchID());
        contribution.setEventID(batch.getEventID());
        contribution.setClubID(event.getClubID());
        contribution.setUserID(userId);
        contribution.setContributionType(contributionType);
        contribution.setLeaderEvaluation(leaderEvaluation);
        contribution.setBasePoints(basePoints);
        contribution.setMultiplier(BigDecimal.ONE);
        contribution.setBonusPoints(bonusPoints);
        contribution.setPenaltyPoints(penaltyPoints);
        contribution.setFinalPoints(basePoints + bonusPoints - penaltyPoints);
        contribution.setStatus(status);
        contribution.setUpdatedAt(now);
        contribution.setUpdatedBy(actorId);
        contribution.setIsDeleted(false);
    }

    private Set<Integer> getScoringMemberUserIds(Event event) {
        if (event == null || event.getClubID() == null || event.getSemesterID() == null) {
            return Set.of();
        }
        return clubMembershipRepository
                .findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
                        event.getClubID(),
                        event.getSemesterID(),
                        List.of(CLUB_ROLE_MEMBER_ID)
                )
                .stream()
                .map(com.fptu.fcms.entity.ClubMembership::getUserID)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private Integer resolveContributionBasePoints(Integer eventId, Integer userId) {
        if (userId == null) {
            return 0;
        }
        return eventRegistrationRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .filter(this::isConfirmedRegistration)
                .isPresent()
                ? REGISTERED_MEMBER_BASE_POINTS
                : 0;
    }

    private boolean isConfirmedRegistration(EventRegistration registration) {
        RegistrationStatus status = registration.getStatus();
        RegistrationStatus registrationStatus = registration.getRegistrationStatus();
        return REGISTRATION_STATUS_CONFIRMED.equals(status)
                || REGISTRATION_STATUS_REGISTERED.equals(status)
                || REGISTRATION_STATUS_CONFIRMED.equals(registrationStatus)
                || REGISTRATION_STATUS_REGISTERED.equals(registrationStatus);
    }

    private ContributionBatch findBatchByEvent(Integer eventId) {
        return contributionBatchRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_BATCH_NOT_FOUND"));
    }

    private Event findEvent(Integer eventId) {
        return eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
    }

    private String normalizeContributionType(String contributionType) {
        if (!StringUtils.hasText(contributionType)) {
            return "";
        }
        String normalized = contributionType.trim().toUpperCase(Locale.ROOT);
        if (!"CORE_TEAM".equals(normalized)
                && !"SUPPORT_ORGANIZER".equals(normalized)
                && !"PARTICIPANT".equals(normalized)
                && !CONTRIBUTION_TYPE_ABSENT.equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRIBUTION_TYPE_INVALID");
        }
        return normalized;
    }

    private String normalizeLeaderEvaluation(String leaderEvaluation) {
        if (!StringUtils.hasText(leaderEvaluation)) {
            return null;
        }
        String normalized = leaderEvaluation.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if (!LEADER_EVALUATION_GOOD.equals(normalized) && !LEADER_EVALUATION_NOT_GOOD.equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LEADER_EVALUATION_INVALID");
        }
        return normalized;
    }

    private AppealStatus parseResolveStatus(String value) {
        String normalized = normalize(value);
        if (AppealStatus.APPROVED.name().equals(normalized)) {
            return AppealStatus.APPROVED;
        }
        if (AppealStatus.REJECTED.name().equals(normalized)) {
            return AppealStatus.REJECTED;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "APPEAL_STATUS_INVALID");
    }

    private int calculateScore(String type) {
        return switch (type) {
            case "CORE_TEAM" -> 50;
            case "SUPPORT_ORGANIZER" -> 30;
            case "PARTICIPANT" -> 20;
            default -> 0;
        };
    }

    private boolean isPresent(AttendanceStatus status) {
        return AttendanceStatus.PRESENT.equals(status);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private ContributionBatchResponse toBatchResponse(ContributionBatch batch) {
        return new ContributionBatchResponse(
                batch.getBatchID(),
                batch.getEventID(),
                batch.getClubID(),
                batch.getSemesterID(),
                batch.getStatus(),
                batch.getReportApprovedBy(),
                batch.getReportApprovedAt(),
                batch.getScoringOpenedAt(),
                batch.getScoringSubmittedAt(),
                batch.getScoringSubmittedBy(),
                batch.getAppealOpenedAt(),
                batch.getAppealClosesAt(),
                batch.getFinalizedAt(),
                batch.getFinalizedBy()
        );
    }

    private AppealResponse toAppealResponse(Appeal appeal) {
        return new AppealResponse(
                appeal.getAppealID(),
                appeal.getBatchID(),
                appeal.getEventID(),
                appeal.getContributionID(),
                appeal.getUserID(),
                appeal.getReason(),
                appeal.getResolutionNote(),
                appeal.getStatus(),
                appeal.getRequestedAt(),
                appeal.getResolvedAt(),
                appeal.getResolvedBy()
        );
    }
}
