package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.AppealCreateRequest;
import com.fptu.fcms.dto.request.AppealResolveRequest;
import com.fptu.fcms.dto.request.ContributionEmergencyOverrideRequest;
import com.fptu.fcms.dto.response.AppealResponse;
import com.fptu.fcms.dto.response.ContributionBatchResponse;
import com.fptu.fcms.dto.response.ContributionDTO;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.ContributionAppeal;
import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventContribution;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.entity.MemberPerformance;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.AppealStatus;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.AppealRepository;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
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
import java.util.HashSet;
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
    private static final EventStatus STATUS_REPORT_APPROVED = EventStatus.REPORT_APPROVED;
    private static final EventStatus STATUS_REPORT_REJECTED = EventStatus.REPORT_REJECTED;
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
    private static final int CLUB_ROLE_LEADER_ID = 1;
    private static final int CLUB_ROLE_VICE_LEADER_ID = 2;
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
    private final ClubRoleRepository clubRoleRepository;
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
        EventReport report = eventReportRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_REPORT_NOT_FOUND"));

        LocalDateTime now = LocalDateTime.now();
        ContributionBatch batch = contributionBatchRepository.findByEventIDAndIsDeletedFalse(eventId).orElse(null);
        if (batch == null) {
            batch = new ContributionBatch();
            batch.setEventID(eventId);
            batch.setClubID(event.getClubID());
            batch.setSemesterID(event.getSemesterID());
            batch.setStatus(ContributionBatchStatus.DRAFT);
            batch.setReportApprovedBy(actorId);
            batch.setReportApprovedAt(now);
            batch.setScoringOpenedAt(now);
            batch.setCreatedAt(now);
            batch.setUpdatedAt(now);
            batch.setIsDeleted(false);
            batch = contributionBatchRepository.save(batch);
        } else {
            batch.setStatus(ContributionBatchStatus.DRAFT);
            batch.setReportApprovedBy(actorId);
            batch.setReportApprovedAt(now);
            batch.setUpdatedAt(now);
            batch = contributionBatchRepository.save(batch);
        }

        report.setStatus(EventReportStatus.APPROVED);
        report.setApprovedBy(actorId);
        report.setApprovedAt(now);
        report.setRejectedBy(null);
        report.setRejectedAt(null);
        report.setRejectionReason(null);
        eventReportRepository.save(report);

        generateDraftContributions(event, batch, actorId, now);

        event.setEventStatus(STATUS_REPORT_APPROVED);
        eventRepository.save(event);
        auditLogService.recordWithRefs(
                actorId,
                "EventReport",
                report.getReportID(),
                "REPORT_APPROVED",
                EventReportStatus.UPLOADED,
                report.getStatus(),
                eventId,
                null,
                null,
                "ICPDP approved report and opened contribution draft"
        );
        return toBatchResponse(batch);
    }

    @Override
    @Transactional
    public void rejectReport(Integer eventId, String reason, Integer actorId) {
        if (!StringUtils.hasText(reason)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REPORT_REJECT_REASON_REQUIRED");
        }

        Event event = findEvent(eventId);
        if (!STATUS_REPORT_UPLOADED.equals(event.getEventStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EVENT_REPORT_NOT_UPLOADED");
        }
        EventReport report = eventReportRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_REPORT_NOT_FOUND"));

        EventStatus beforeStatus = event.getEventStatus();
        EventReportStatus beforeReportStatus = report.getStatus();
        LocalDateTime now = LocalDateTime.now();

        report.setStatus(EventReportStatus.REJECTED);
        report.setRejectedBy(actorId);
        report.setRejectedAt(now);
        report.setRejectionReason(reason.trim());
        report.setApprovedBy(null);
        report.setApprovedAt(null);
        eventReportRepository.save(report);

        event.setEventStatus(STATUS_REPORT_REJECTED);
        event.setRejectionReason(reason.trim());
        eventRepository.save(event);

        auditLogService.recordWithRefs(
                actorId,
                "EventReport",
                report.getReportID(),
                "REPORT_REJECTED",
                beforeReportStatus,
                report.getStatus(),
                eventId,
                null,
                null,
                reason.trim()
        );
        auditLogService.recordWithRefs(
                actorId,
                "Event",
                event.getEventID(),
                "EVENT_REPORT_REJECTED",
                beforeStatus,
                event.getEventStatus(),
                eventId,
                null,
                null,
                reason.trim()
        );
    }

    @Override
    @Transactional
    public ContributionBatchResponse getBatchByEvent(Integer eventId) {
        Event event = findEvent(eventId);
        LocalDateTime now = LocalDateTime.now();
        ContributionBatch batch = getOrCreateDraftBatch(event, null, now);
        generateDraftContributions(event, batch, null, now);
        return toBatchResponse(batch);
    }

    @Override
    @Transactional
    public List<ContributionDTO> getContributionScores(Integer eventId) {
        Event event = findEvent(eventId);
        ContributionBatch batch = getOrCreateDraftBatch(event, null, LocalDateTime.now());
        generateDraftContributions(event, batch, null, LocalDateTime.now());
        return contributionRepository.findByBatchIDAndIsDeletedFalse(batch.getBatchID())
                .stream()
                .map(this::toContributionDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContributionDTO> getMyContributionScores(Integer userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED");
        }
        return contributionRepository.findByUserIDAndIsDeletedFalse(userId)
                .stream()
                .map(this::toContributionDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ContributionDTO getMyContributionScore(Integer eventId, Integer userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED");
        }
        EventContribution contribution = contributionRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_SCORE_NOT_FOUND"));
        return toContributionDto(contribution);
    }

    @Override
    @Transactional
    public ContributionBatchResponse saveContributionScores(Integer eventId, List<ContributionDTO> contributions, Integer actorId) {
        Event event = findEvent(eventId);
        assertEventNotClosed(event);
        ContributionBatch batch = findBatchByEvent(eventId);
        if (!isDraftStatus(batch.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRIBUTION_BATCH_NOT_DRAFT");
        }

        LocalDateTime now = LocalDateTime.now();
        for (ContributionDTO dto : contributions == null ? List.<ContributionDTO>of() : contributions) {
            Integer userId = dto.getUserID();
            if (userId == null) {
                continue;
            }
            String type = normalizeContributionType(dto.getContributionType());
            String leaderEvaluation = normalizeLeaderEvaluation(dto.getLeaderEvaluation());
            String rationale = trimToNull(dto.getRationale());
            if (!StringUtils.hasText(type)
                    && !StringUtils.hasText(leaderEvaluation)
                    && !StringUtils.hasText(rationale)) {
                continue;
            }
            EventContribution contribution = contributionRepository.findByBatchIDAndUserIDAndIsDeletedFalse(batch.getBatchID(), userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "CONTRIBUTION_SCORE_NOT_FOUND"));
            assertNoSelfMutation(actorId, contribution, "SELF_EVALUATION_NOT_ALLOWED");
            if (!StringUtils.hasText(type)) {
                type = contribution.getContributionType();
            }
            if (!StringUtils.hasText(leaderEvaluation)) {
                leaderEvaluation = contribution.getLeaderEvaluation();
            }
            applyScore(event, batch, contribution, userId, type, leaderEvaluation, actorId, CONTRIBUTION_STATUS_DRAFT, now);
            contribution.setTier(resolveTier(contribution.getFinalPoints()));
            contribution.setRationale(rationale);
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
        Event event = findEvent(eventId);
        assertEventNotClosed(event);
        ContributionBatch batch = findBatchByEvent(eventId);
        if (!isDraftStatus(batch.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRIBUTION_BATCH_NOT_DRAFT");
        }
        if (contributionRepository.findByBatchIDAndIsDeletedFalse(batch.getBatchID()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRIBUTION_SCORES_REQUIRED");
        }
        if (actorId != null && contributionRepository.existsByBatchIDAndUserIDAndIsDeletedFalse(batch.getBatchID(), actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SELF_FINALIZATION_NOT_ALLOWED");
        }
        LocalDateTime now = LocalDateTime.now();
        batch.setStatus(ContributionBatchStatus.APPEAL_WINDOW);
        batch.setAppealOpenedAt(now);
        batch.setAppealClosesAt(now.plusHours(24));
        batch.setUpdatedAt(now);
        ContributionBatch saved = contributionBatchRepository.save(batch);
        auditLogService.recordWithRefs(actorId, "ContributionBatch", saved.getBatchID(), "CONTRIBUTION_APPEAL_OPENED", null, saved.getStatus(), eventId, null, null, "Opened 24-hour appeal window");
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
        Event event = findEvent(batch.getEventID());
        assertEventNotClosed(event);
        LocalDateTime now = LocalDateTime.now();
        if (!isAppealWindowStatus(batch.getStatus()) || batch.getAppealClosesAt() == null || !now.isBefore(batch.getAppealClosesAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEAL_WINDOW_CLOSED");
        }
        EventContribution contribution = contributionRepository.findByBatchIDAndUserIDAndIsDeletedFalse(batchId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "CONTRIBUTION_SCORE_NOT_FOUND"));
        if (appealRepository.existsByBatchIDAndUserIDAndIsDeletedFalse(batchId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEAL_ALREADY_SUBMITTED");
        }

        ContributionAppeal appeal = new ContributionAppeal();
        appeal.setBatchID(batchId);
        appeal.setEventID(batch.getEventID());
        appeal.setContributionID(contribution.getContributionID());
        appeal.setUserID(userId);
        appeal.setReason(trimToBlank(request.getReason()));
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
        ContributionAppeal appeal = appealRepository.findByAppealIDAndIsDeletedFalse(appealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "APPEAL_NOT_FOUND"));
        if (appeal.getStatus() != AppealStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEAL_ALREADY_RESOLVED");
        }
        ContributionBatch batch = contributionBatchRepository.findByBatchIDAndIsDeletedFalse(appeal.getBatchID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_BATCH_NOT_FOUND"));
        Event event = findEvent(batch.getEventID());
        assertEventNotClosed(event);
        if (!isAppealWindowStatus(batch.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRIBUTION_BATCH_NOT_IN_APPEAL");
        }
        if (!StringUtils.hasText(request.getResolutionNote())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "APPEAL_RESOLUTION_REASON_REQUIRED");
        }
        if (Objects.equals(actorId, appeal.getUserID())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SELF_APPEAL_RESOLUTION_NOT_ALLOWED");
        }

        AppealStatus status = parseResolveStatus(request.getStatus());
        if (status == AppealStatus.APPROVED) {
            EventContribution contribution = contributionRepository.findById(appeal.getContributionID())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_SCORE_NOT_FOUND"));
            String type = StringUtils.hasText(request.getContributionType())
                    ? normalizeContributionType(request.getContributionType())
                    : contribution.getContributionType();
            String leaderEvaluation = StringUtils.hasText(request.getLeaderEvaluation())
                    ? normalizeLeaderEvaluation(request.getLeaderEvaluation())
                    : contribution.getLeaderEvaluation();
            String tier = normalizeTier(request.getTier());
            applyScore(event, batch, contribution, appeal.getUserID(), type, leaderEvaluation, actorId, CONTRIBUTION_STATUS_DRAFT, LocalDateTime.now());
            contribution.setTier(StringUtils.hasText(tier) ? tier : resolveTier(contribution.getFinalPoints()));
            contributionRepository.save(contribution);
        }

        appeal.setStatus(status);
        appeal.setResolutionNote(request.getResolutionNote());
        appeal.setResolvedAt(LocalDateTime.now());
        appeal.setResolvedBy(actorId);
        ContributionAppeal saved = appealRepository.save(appeal);
        auditLogService.recordWithRefs(actorId, "ContributionAppeal", saved.getAppealID(), "CONTRIBUTION_APPEAL_RESOLVED", null, saved.getStatus(), saved.getEventID(), null, null, request.getResolutionNote());
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
        assertEventNotClosed(event);
        boolean draftFinalization = isDraftStatus(batch.getStatus());
        boolean appealFinalization = isAppealWindowStatus(batch.getStatus());
        if (!draftFinalization && !appealFinalization) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRIBUTION_BATCH_NOT_IN_APPEAL");
        }
        LocalDateTime now = LocalDateTime.now();
        if (appealFinalization && appealRepository.existsByBatchIDAndStatusAndIsDeletedFalse(batch.getBatchID(), AppealStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPEALS_PENDING");
        }

        List<EventContribution> contributions = contributionRepository.findByBatchIDAndIsDeletedFalse(batch.getBatchID());
        if (contributions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRIBUTION_SCORES_REQUIRED");
        }
        if (draftFinalization && actorId != null
                && contributionRepository.existsByBatchIDAndUserIDAndIsDeletedFalse(batch.getBatchID(), actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SELF_FINALIZATION_NOT_ALLOWED");
        }
        for (EventContribution contribution : contributions) {
            if (contribution.getUserID() == null) {
                continue;
            }
            if (Boolean.TRUE.equals(contribution.getIndividualRankingEligible())) {
                MemberPerformance performance = memberPerformanceRepository
                        .findByEventIDAndUserIDAndIsDeletedFalse(eventId, contribution.getUserID())
                        .orElseGet(MemberPerformance::new);
                performance.setClubID(event.getClubID());
                performance.setEventID(eventId);
                performance.setUserID(contribution.getUserID());
                performance.setBasePoints(nullToZero(contribution.getBasePoints()));
                performance.setBonusPoints(nullToZero(contribution.getBonusPoints()));
                performance.setLeaderEvaluation(contribution.getLeaderEvaluation());
                performance.setPenaltyPoints(nullToZero(contribution.getPenaltyPoints()));
                performance.setSourceContributionID(contribution.getContributionID());
                performance.setIndividualRankingEligible(true);
                performance.setUpdatedAt(now);
                performance.setIsDeleted(false);
                memberPerformanceRepository.save(performance);
                contribution.setReleasedToPerformance(true);
            } else {
                contribution.setReleasedToPerformance(false);
            }

            contribution.setStatus(CONTRIBUTION_STATUS_FINALIZED);
            contribution.setCalculatedAt(now);
            contribution.setFinalizedAt(now);
            contribution.setFinalizedBy(actorId);
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
        auditLogService.recordWithRefs(actorId, "ContributionBatch", saved.getBatchID(), "CONTRIBUTION_BATCH_FINALIZED", null, saved.getStatus(), eventId, null, null, "Finalized contributions into MemberPerformance");
        return toBatchResponse(saved);
    }

    @Override
    @Transactional
    public ContributionDTO emergencyOverrideContribution(Integer eventId, ContributionEmergencyOverrideRequest request, Integer actorId) {
        if (request == null || !StringUtils.hasText(request.getReason())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EMERGENCY_OVERRIDE_REASON_REQUIRED");
        }
        Event event = findEvent(eventId);
        assertEventNotClosed(event);
        ContributionBatch batch = findBatchByEvent(eventId);
        EventContribution contribution = findOverrideTarget(batch, request);
        String before = snapshotContribution(contribution);

        String type = StringUtils.hasText(request.getContributionType())
                ? normalizeContributionType(request.getContributionType())
                : contribution.getContributionType();
        String leaderEvaluation = StringUtils.hasText(request.getLeaderEvaluation())
                ? normalizeLeaderEvaluation(request.getLeaderEvaluation())
                : contribution.getLeaderEvaluation();
        String tier = normalizeTier(request.getTier());
        LocalDateTime now = LocalDateTime.now();
        String contributionStatus = batch.getStatus() == ContributionBatchStatus.FINALIZED
                ? CONTRIBUTION_STATUS_FINALIZED
                : CONTRIBUTION_STATUS_DRAFT;
        applyScore(event, batch, contribution, contribution.getUserID(), type, leaderEvaluation, actorId, contributionStatus, now);
        contribution.setTier(StringUtils.hasText(tier) ? tier : resolveTier(contribution.getFinalPoints()));
        contribution.setRationale(trimToNull(request.getRationale()));
        if (batch.getStatus() == ContributionBatchStatus.FINALIZED) {
            contribution.setFinalizedAt(now);
            contribution.setFinalizedBy(actorId);
            releasePerformanceIfEligible(event, contribution, now);
        }
        EventContribution saved = contributionRepository.save(contribution);
        auditLogService.recordWithRefs(
                actorId,
                "EventContribution",
                saved.getContributionID(),
                "CONTRIBUTION_EMERGENCY_OVERRIDE",
                before,
                snapshotContribution(saved),
                eventId,
                null,
                null,
                request.getReason().trim()
        );
        return toContributionDto(saved);
    }

    private EventContribution findOverrideTarget(ContributionBatch batch, ContributionEmergencyOverrideRequest request) {
        EventContribution contribution;
        if (request.getContributionID() != null) {
            contribution = contributionRepository.findById(request.getContributionID())
                    .filter(item -> Objects.equals(item.getBatchID(), batch.getBatchID()))
                    .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_SCORE_NOT_FOUND"));
        } else if (request.getUserID() != null) {
            contribution = contributionRepository.findByBatchIDAndUserIDAndIsDeletedFalse(batch.getBatchID(), request.getUserID())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_SCORE_NOT_FOUND"));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRIBUTION_TARGET_REQUIRED");
        }
        return contribution;
    }

    private void releasePerformanceIfEligible(Event event, EventContribution contribution, LocalDateTime now) {
        if (!Boolean.TRUE.equals(contribution.getIndividualRankingEligible())) {
            contribution.setReleasedToPerformance(false);
            return;
        }
        MemberPerformance performance = memberPerformanceRepository
                .findByEventIDAndUserIDAndIsDeletedFalse(event.getEventID(), contribution.getUserID())
                .orElseGet(MemberPerformance::new);
        performance.setClubID(event.getClubID());
        performance.setEventID(event.getEventID());
        performance.setUserID(contribution.getUserID());
        performance.setBasePoints(nullToZero(contribution.getBasePoints()));
        performance.setBonusPoints(nullToZero(contribution.getBonusPoints()));
        performance.setLeaderEvaluation(contribution.getLeaderEvaluation());
        performance.setPenaltyPoints(nullToZero(contribution.getPenaltyPoints()));
        performance.setSourceContributionID(contribution.getContributionID());
        performance.setIndividualRankingEligible(true);
        performance.setUpdatedAt(now);
        performance.setIsDeleted(false);
        memberPerformanceRepository.save(performance);
        contribution.setReleasedToPerformance(true);
    }

    private String snapshotContribution(EventContribution contribution) {
        if (contribution == null) {
            return "";
        }
        return "type=%s,evaluation=%s,tier=%s,base=%s,bonus=%s,penalty=%s,final=%s,eligible=%s"
                .formatted(
                        contribution.getContributionType(),
                        contribution.getLeaderEvaluation(),
                        contribution.getTier(),
                        contribution.getBasePoints(),
                        contribution.getBonusPoints(),
                        contribution.getPenaltyPoints(),
                        contribution.getFinalPoints(),
                        contribution.getIndividualRankingEligible()
                );
    }

    private void generateDraftContributions(Event event, ContributionBatch batch, Integer actorId, LocalDateTime now) {
        List<EventContribution> existing = contributionRepository.findByBatchIDAndIsDeletedFalse(batch.getBatchID());
        if (!existing.isEmpty()) {
            return;
        }

        List<EventRegistration> registrations = eventRegistrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID());
        Map<Integer, EventRegistration> confirmedRegistrationByUser = registrations.stream()
                .filter(reg -> reg.getUserID() != null)
                .filter(this::isConfirmedRegistration)
                .collect(Collectors.toMap(EventRegistration::getUserID, Function.identity(), (a, b) -> a));

        Map<Integer, EventAssignment> assignmentByUser = eventAssignmentRepository.findByEventIDAndIsDeletedFalse(event.getEventID())
                .stream()
                .filter(assignment -> assignment.getUserID() != null)
                .collect(Collectors.toMap(EventAssignment::getUserID, Function.identity(), (a, b) -> a));
        AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID()).orElse(null);
        Map<Integer, AttendanceRecord> attendanceByUser = session == null ? Map.of() : attendanceRecordRepository.findBySessionID(session.getSessionID())
                .stream()
                .filter(record -> record.getUserID() != null)
                .collect(Collectors.toMap(AttendanceRecord::getUserID, Function.identity(), (a, b) -> a));

        Set<Integer> candidateUserIds = new HashSet<>();
        candidateUserIds.addAll(confirmedRegistrationByUser.keySet());
        candidateUserIds.addAll(assignmentByUser.keySet());
        candidateUserIds.addAll(attendanceByUser.keySet());
        if (candidateUserIds.isEmpty()) {
            return;
        }

        Map<Integer, ClubMembership> membershipByUser = clubMembershipRepository
                .findByClubIDAndSemesterIDAndIsDeletedFalse(event.getClubID(), event.getSemesterID())
                .stream()
                .filter(membership -> membership.getUserID() != null)
                .filter(membership -> candidateUserIds.contains(membership.getUserID()))
                .collect(Collectors.toMap(ClubMembership::getUserID, Function.identity(), (a, b) -> a));
        if (membershipByUser.isEmpty()) {
            return;
        }

        Map<Integer, String> roleNameById = clubRoleRepository.findAllById(
                        membershipByUser.values().stream()
                                .map(ClubMembership::getClubRoleID)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet())
                )
                .stream()
                .collect(Collectors.toMap(ClubRole::getClubRoleID, ClubRole::getRoleName, (a, b) -> a));

        for (ClubMembership membership : membershipByUser.values()) {
            Integer userId = membership.getUserID();
            EventRegistration registration = confirmedRegistrationByUser.get(userId);
            EventAssignment assignment = assignmentByUser.get(userId);
            AttendanceRecord attendanceRecord = attendanceByUser.get(userId);
            String contributionType = resolveDefaultContributionType(userId, assignmentByUser.values().stream().toList(), attendanceByUser.values().stream().toList());
            EventContribution contribution = new EventContribution();
            applyScore(event, batch, contribution, userId, contributionType, null, actorId, CONTRIBUTION_STATUS_DRAFT, now);
            contribution.setRegistrationID(registration == null ? null : registration.getRegistrationID());
            contribution.setAttendanceRecordID(attendanceRecord == null ? null : attendanceRecord.getRecordID());
            contribution.setAssignmentID(assignment == null ? null : assignment.getAssignmentID());
            contribution.setMembershipID(membership.getMembershipID());
            contribution.setClubRoleIDSnapshot(membership.getClubRoleID());
            String roleName = roleNameById.get(membership.getClubRoleID());
            contribution.setClubRoleSnapshot(roleName);
            contribution.setIndividualRankingEligible(isMemberRole(membership.getClubRoleID(), roleName));
            contribution.setTier(resolveTier(contribution.getFinalPoints()));
            contribution.setRationale(null);
            contribution.setReleasedToPerformance(false);
            contributionRepository.save(contribution);
        }
    }

    private ContributionBatch getOrCreateDraftBatch(Event event, Integer actorId, LocalDateTime now) {
        ContributionBatch batch = contributionBatchRepository.findByEventIDAndIsDeletedFalse(event.getEventID()).orElse(null);
        if (batch != null) {
            return batch;
        }

        batch = new ContributionBatch();
        batch.setEventID(event.getEventID());
        batch.setClubID(event.getClubID());
        batch.setSemesterID(event.getSemesterID());
        batch.setStatus(ContributionBatchStatus.DRAFT);
        batch.setReportApprovedBy(actorId);
        batch.setReportApprovedAt(now);
        batch.setScoringOpenedAt(now);
        batch.setCreatedAt(now);
        batch.setUpdatedAt(now);
        batch.setIsDeleted(false);
        return contributionBatchRepository.save(batch);
    }

    private ContributionDTO toContributionDto(EventContribution contribution) {
        Integer userId = contribution.getUserID();
        String userName = userRepository.findById(userId).map(UserAccount::getFullName).orElse("Unknown");
        ContributionDTO dto = new ContributionDTO(userId, userName, nullToBlank(contribution.getContributionType()), nullToBlank(contribution.getLeaderEvaluation()));
        dto.setContributionID(contribution.getContributionID());
        dto.setBatchID(contribution.getBatchID());
        dto.setEventID(contribution.getEventID());
        dto.setClubID(contribution.getClubID());
        dto.setRegistrationID(contribution.getRegistrationID());
        dto.setAttendanceRecordID(contribution.getAttendanceRecordID());
        dto.setAssignmentID(contribution.getAssignmentID());
        dto.setMembershipID(contribution.getMembershipID());
        dto.setClubRoleIDSnapshot(contribution.getClubRoleIDSnapshot());
        dto.setClubRoleSnapshot(contribution.getClubRoleSnapshot());
        dto.setIndividualRankingEligible(Boolean.TRUE.equals(contribution.getIndividualRankingEligible()));
        dto.setTier(contribution.getTier());
        dto.setRationale(contribution.getRationale());
        dto.setBasePoints(contribution.getBasePoints());
        dto.setBonusPoints(contribution.getBonusPoints());
        dto.setPenaltyPoints(contribution.getPenaltyPoints());
        dto.setFinalPoints(contribution.getFinalPoints());
        dto.setStatus(contribution.getStatus());
        contributionBatchRepository.findByBatchIDAndIsDeletedFalse(contribution.getBatchID()).ifPresent(batch -> {
            dto.setBatchStatus(batch.getStatus() == null ? null : batch.getStatus().name());
            dto.setAppealClosesAt(batch.getAppealClosesAt());
        });
        eventRepository.findById(contribution.getEventID()).ifPresent(event -> {
            dto.setEventName(event.getEventName());
            dto.setEventStartDate(event.getStartDate());
        });
        appealRepository.findTopByBatchIDAndUserIDAndIsDeletedFalseOrderByRequestedAtDesc(contribution.getBatchID(), contribution.getUserID()).ifPresent(appeal -> {
            dto.setAppealID(appeal.getAppealID());
            dto.setAppealStatus(appeal.getStatus() == null ? null : appeal.getStatus().name());
            dto.setAppealReason(appeal.getReason());
            dto.setAppealResolutionNote(appeal.getResolutionNote());
            dto.setAppealRequestedAt(appeal.getRequestedAt());
            dto.setAppealResolvedAt(appeal.getResolvedAt());
        });
        return dto;
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
            EventContribution contribution,
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
        RegistrationStatus registrationStatus = registration.getRegistrationStatus();
        return REGISTRATION_STATUS_CONFIRMED.equals(registrationStatus)
                || REGISTRATION_STATUS_REGISTERED.equals(registrationStatus);
    }

    private ContributionBatch findBatchByEvent(Integer eventId) {
        return contributionBatchRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRIBUTION_BATCH_NOT_FOUND"));
    }

    private boolean isDraftStatus(ContributionBatchStatus status) {
        return status == ContributionBatchStatus.DRAFT || status == ContributionBatchStatus.SCORING;
    }

    private boolean isAppealWindowStatus(ContributionBatchStatus status) {
        return status == ContributionBatchStatus.APPEAL_WINDOW
                || status == ContributionBatchStatus.APPEAL_OPEN
                || status == ContributionBatchStatus.APPEAL_RESOLUTION;
    }

    private Event findEvent(Integer eventId) {
        return eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
    }

    private void assertEventNotClosed(Event event) {
        if (event != null && EventStatus.CLOSED.equals(event.getEventStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EVENT_CLOSED");
        }
    }

    private void assertNoSelfMutation(Integer actorId, EventContribution contribution, String errorCode) {
        if (actorId != null && contribution != null && Objects.equals(actorId, contribution.getUserID())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, errorCode);
        }
    }

    private boolean isMemberRole(Integer roleId, String roleName) {
        if (roleId != null) {
            return roleId == CLUB_ROLE_MEMBER_ID;
        }
        return "MEMBER".equals(normalize(roleName));
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

    private String normalizeTier(String tier) {
        if (!StringUtils.hasText(tier)) {
            return null;
        }
        String normalized = tier.trim().toUpperCase(Locale.ROOT);
        if (!"A".equals(normalized) && !"B".equals(normalized) && !"C".equals(normalized) && !"D".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRIBUTION_TIER_INVALID");
        }
        return normalized;
    }

    private String resolveTier(Integer finalPoints) {
        int points = finalPoints == null ? 0 : finalPoints;
        if (points >= 140) {
            return "A";
        }
        if (points >= 120) {
            return "B";
        }
        if (points >= 90) {
            return "C";
        }
        return "D";
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
        if ("ACCEPTED".equals(normalized)) {
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

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String trimToBlank(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }

    private int nullToZero(Integer value) {
        return value == null ? 0 : value;
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

    private AppealResponse toAppealResponse(ContributionAppeal appeal) {
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
