package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.ClubEvaluationRequest;
import com.fptu.fcms.dto.response.ClubDashboardResponse;
import com.fptu.fcms.dto.response.ClubDashboardResponse.AttentionItem;
import com.fptu.fcms.dto.response.ClubDashboardResponse.AttendanceMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ChartPoint;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ComparisonMetric;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ContributionMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.DashboardWarning;
import com.fptu.fcms.dto.response.ClubDashboardResponse.EventMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.KpiComponent;
import com.fptu.fcms.dto.response.ClubDashboardResponse.MemberMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.MetricCard;
import com.fptu.fcms.dto.response.ClubDashboardResponse.RecruitmentMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.RegistrationMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ReportMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.SelectableOption;
import com.fptu.fcms.dto.response.ClubDashboardResponse.SemesterSummary;
import com.fptu.fcms.dto.response.ClubDashboardResponse.SuggestedDecision;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ViolationMetrics;
import com.fptu.fcms.dto.response.ClubEvaluationResponse;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.ClubEvaluation;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubDashboardQueryRepository;
import com.fptu.fcms.repository.ClubDashboardQueryRepository.AttentionRow;
import com.fptu.fcms.repository.ClubDashboardQueryRepository.CountItem;
import com.fptu.fcms.repository.ClubDashboardQueryRepository.MonthlyCount;
import com.fptu.fcms.repository.ClubDashboardQueryRepository.ScoreStats;
import com.fptu.fcms.repository.ClubEvaluationRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemConfigRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubDashboardService;
import com.fptu.fcms.service.impl.ClubDashboardCalculator.DashboardConfig;
import com.fptu.fcms.service.impl.ClubDashboardCalculator.KpiResult;
import com.fptu.fcms.service.impl.ClubDashboardCalculator.KpiWeights;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class ClubDashboardServiceImpl implements ClubDashboardService {

    private static final List<RegistrationStatus> VALID_REGISTRATION_STATUSES = List.of(
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.REGISTERED,
            RegistrationStatus.PROMOTED
    );
    private static final List<EventStatus> APPROVED_EVENT_STATUSES = List.of(
            EventStatus.APPROVED,
            EventStatus.REGISTRATION_OPEN,
            EventStatus.REGISTRATION_CLOSED,
            EventStatus.ONGOING,
            EventStatus.CHECKIN_OPEN,
            EventStatus.COMPLETED,
            EventStatus.REPORT_UPLOADED,
            EventStatus.REPORT_PENDING_APPROVAL,
            EventStatus.REPORT_APPROVED,
            EventStatus.CONTRIBUTION_DRAFT,
            EventStatus.CONTRIBUTION_PENDING_APPROVAL,
            EventStatus.CONTRIBUTION_APPROVED,
            EventStatus.CONTRIBUTION_SCORING,
            EventStatus.CONTRIBUTION_FINALIZED,
            EventStatus.CLOSED
    );
    private static final List<EventStatus> COMPLETED_EVENT_STATUSES = List.of(
            EventStatus.COMPLETED,
            EventStatus.REPORT_UPLOADED,
            EventStatus.REPORT_PENDING_APPROVAL,
            EventStatus.REPORT_APPROVED,
            EventStatus.CONTRIBUTION_DRAFT,
            EventStatus.CONTRIBUTION_PENDING_APPROVAL,
            EventStatus.CONTRIBUTION_APPROVED,
            EventStatus.CONTRIBUTION_SCORING,
            EventStatus.CONTRIBUTION_FINALIZED,
            EventStatus.CLOSED
    );
    private static final Set<String> DECISIONS = Set.of(
            "Continue",
            "Continue with Improvement Plan",
            "Warning",
            "Suspend",
            "Close"
    );

    private final ClubRepository clubRepository;
    private final SemesterRepository semesterRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubEvaluationRepository clubEvaluationRepository;
    private final ClubDashboardQueryRepository dashboardQueryRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ClubDashboardResponse getDashboard(Integer clubId, Integer semesterId, UserPrincipal currentUser) {
        requireAuthenticated(currentUser);
        Club club = clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new BusinessRuleException("Club not found", HttpStatus.NOT_FOUND));
        Semester semester = resolveSemester(semesterId);
        requireDashboardAccess(clubId, semester.getSemesterID(), currentUser);

        DashboardConfig config = loadConfig();
        Semester previousSemester = findPreviousSemester(semester).orElse(null);

        DashboardCalculation current = calculate(clubId, semester, config);
        DashboardCalculation previous = previousSemester == null ? null : calculate(clubId, previousSemester, config);
        List<DashboardWarning> warnings = buildWarnings(clubId, current, previous, config);
        SuggestedDecision suggestedDecision = buildSuggestedDecision(current.kpiScore(), warnings, config);

        ClubEvaluationResponse latestEvaluation = clubEvaluationRepository
                .findTopByClubIDAndSemesterIDAndIsDeletedFalseOrderByEvaluatedAtDescEvaluationIDDesc(clubId, semester.getSemesterID())
                .map(this::mapEvaluation)
                .orElse(null);
        List<ClubEvaluationResponse> evaluationHistory = clubEvaluationRepository
                .findByClubIDAndSemesterIDAndIsDeletedFalseOrderByEvaluatedAtDescEvaluationIDDesc(clubId, semester.getSemesterID())
                .stream()
                .map(this::mapEvaluation)
                .toList();

        return ClubDashboardResponse.builder()
                .club(mapClub(club))
                .semester(mapSemester(semester))
                .previousSemester(previousSemester == null ? null : mapSemester(previousSemester))
                .availableClubs(resolveAvailableClubs(currentUser, club))
                .availableSemesters(semesterRepository.findAll().stream()
                        .sorted(Comparator.comparing(Semester::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                        .map(this::mapSemester)
                        .toList())
                .overviewMetrics(buildOverviewMetrics(current, previous, latestEvaluation, suggestedDecision))
                .memberMetrics(current.memberMetrics())
                .eventMetrics(current.eventMetrics())
                .registrationMetrics(current.registrationMetrics())
                .attendanceMetrics(current.attendanceMetrics())
                .contributionMetrics(current.contributionMetrics())
                .reportMetrics(current.reportMetrics())
                .recruitmentMetrics(current.recruitmentMetrics())
                .violationMetrics(current.violationMetrics())
                .kpiBreakdown(current.kpiBreakdown())
                .semesterComparison(buildSemesterComparison(current, previous))
                .warnings(warnings)
                .suggestedDecision(suggestedDecision)
                .latestEvaluation(latestEvaluation)
                .evaluationHistory(evaluationHistory)
                .lastUpdatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DashboardWarning> getWarnings(Integer clubId, Integer semesterId, UserPrincipal currentUser) {
        return getDashboard(clubId, semesterId, currentUser).getWarnings();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClubEvaluationResponse> getEvaluations(Integer clubId, Integer semesterId, UserPrincipal currentUser) {
        requireAuthenticated(currentUser);
        Semester semester = semesterId == null ? null : resolveSemester(semesterId);
        Integer accessSemesterId = semester == null ? resolveSemester(null).getSemesterID() : semester.getSemesterID();
        requireDashboardAccess(clubId, accessSemesterId, currentUser);

        List<ClubEvaluation> evaluations = semester == null
                ? clubEvaluationRepository.findByClubIDAndIsDeletedFalseOrderByEvaluatedAtDescEvaluationIDDesc(clubId)
                : clubEvaluationRepository.findByClubIDAndSemesterIDAndIsDeletedFalseOrderByEvaluatedAtDescEvaluationIDDesc(clubId, semester.getSemesterID());
        return evaluations.stream().map(this::mapEvaluation).toList();
    }

    @Override
    @Transactional
    public ClubEvaluationResponse createEvaluation(Integer clubId, ClubEvaluationRequest request, UserPrincipal currentUser) {
        requireEvaluator(currentUser);
        validateEvaluationRequest(request);
        ClubDashboardResponse dashboard = getDashboard(clubId, request.getSemesterId(), currentUser);

        ClubEvaluation evaluation = new ClubEvaluation();
        evaluation.setClubID(clubId);
        evaluation.setSemesterID(dashboard.getSemester().getSemesterID());
        evaluation.setKpiScore(dashboard.getSuggestedDecision().getKpiScore());
        evaluation.setSuggestedDecision(dashboard.getSuggestedDecision().getDecision());
        applyEvaluationRequest(evaluation, request, currentUser.getUserId(), true);
        return mapEvaluation(clubEvaluationRepository.save(evaluation));
    }

    @Override
    @Transactional
    public ClubEvaluationResponse updateEvaluation(Integer clubId, Integer evaluationId, ClubEvaluationRequest request, UserPrincipal currentUser) {
        requireEvaluator(currentUser);
        validateEvaluationRequest(request);

        ClubEvaluation evaluation = clubEvaluationRepository.findByEvaluationIDAndClubIDAndIsDeletedFalse(evaluationId, clubId)
                .orElseThrow(() -> new BusinessRuleException("Evaluation not found", HttpStatus.NOT_FOUND));
        evaluation.setPreviousFinalDecision(evaluation.getFinalDecision());
        applyEvaluationRequest(evaluation, request, currentUser.getUserId(), false);
        return mapEvaluation(clubEvaluationRepository.save(evaluation));
    }

    private DashboardCalculation calculate(Integer clubId, Semester semester, DashboardConfig config) {
        Integer semesterId = semester.getSemesterID();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reportOverdueCutoff = now.minusDays(config.reportDeadlineDays());

        long totalMembers = dashboardQueryRepository.countMembers(clubId, semesterId);
        Map<String, Long> roleCounts = dashboardQueryRepository.countMembersByRole(clubId, semesterId);
        long activeMembers = dashboardQueryRepository.countActiveMembers(clubId, semesterId, VALID_REGISTRATION_STATUSES);
        long participatedMembers = dashboardQueryRepository.countMembersWithEventParticipation(clubId, semesterId, VALID_REGISTRATION_STATUSES);
        long newMembers = dashboardQueryRepository.countNewMembers(clubId, semesterId, semester.getStartDate(), semester.getEndDate());
        long disciplinedMembers = dashboardQueryRepository.countMembersWithActiveDiscipline(clubId, semesterId);
        List<AttentionRow> lowContributionRows = dashboardQueryRepository.findLowContributionMembers(clubId, semesterId, config.lowContributionScore(), 200);
        List<AttentionRow> noParticipationRows = dashboardQueryRepository.findMembersWithoutParticipation(clubId, semesterId, VALID_REGISTRATION_STATUSES, 10);

        MemberMetrics memberMetrics = MemberMetrics.builder()
                .totalMembers(totalMembers)
                .activeMembers(activeMembers)
                .activeMemberRate(rate(activeMembers, totalMembers))
                .leaderCount(roleCount(roleCounts, "Leader"))
                .viceLeaderCount(roleCount(roleCounts, "ViceLeader"))
                .memberCount(roleCount(roleCounts, "Member"))
                .newMembers(newMembers)
                .inactiveMembers(Math.max(0, totalMembers - activeMembers))
                .disciplinedMembers(disciplinedMembers)
                .lowContributionMembers(lowContributionRows.size())
                .noEventParticipationMembers(Math.max(0, totalMembers - participatedMembers))
                .retentionRate(rate(totalMembers, totalMembers))
                .eventParticipationRate(rate(participatedMembers, totalMembers))
                .roleDistribution(toChart(roleCounts))
                .memberTrend(monthlyToChart(dashboardQueryRepository.memberMonthlyTrend(clubId, semesterId)))
                .membersNeedAttention(mergeAttentionRows(lowContributionRows.stream().limit(5).toList(), noParticipationRows))
                .build();

        long totalEvents = dashboardQueryRepository.countEvents(clubId, semesterId);
        long approvedEvents = dashboardQueryRepository.countEventsInStatuses(clubId, semesterId, APPROVED_EVENT_STATUSES);
        long completedEvents = dashboardQueryRepository.countEventsInStatuses(clubId, semesterId, COMPLETED_EVENT_STATUSES);
        long cancelledEvents = dashboardQueryRepository.countEventsInStatuses(clubId, semesterId, List.of(EventStatus.CANCELLED));
        long missingReportEvents = dashboardQueryRepository.countEventsMissingReport(clubId, semesterId, now, COMPLETED_EVENT_STATUSES);
        long lateReportEvents = dashboardQueryRepository.countLateReports(clubId, semesterId, config.reportDeadlineDays());
        long notFinalizedContributionEvents = dashboardQueryRepository.countContributionBatchesNotFinalized(clubId, semesterId);

        EventMetrics eventMetrics = EventMetrics.builder()
                .totalEvents(totalEvents)
                .approvedEvents(approvedEvents)
                .completedEvents(completedEvents)
                .cancelledEvents(cancelledEvents)
                .missingReportEvents(missingReportEvents)
                .lateReportEvents(lateReportEvents)
                .notFinalizedContributionEvents(notFinalizedContributionEvents)
                .eventCompletionRate(rate(completedEvents, approvedEvents))
                .cancellationRate(rate(cancelledEvents, approvedEvents))
                .statusDistribution(toChart(dashboardQueryRepository.countEventsByStatus(clubId, semesterId)))
                .monthlyTrend(monthlyToChart(dashboardQueryRepository.eventMonthlyTrend(clubId, semesterId)))
                .eventsNeedAttention(toAttentionItems(dashboardQueryRepository.findEventIssues(clubId, semesterId, reportOverdueCutoff, COMPLETED_EVENT_STATUSES, 10), "EVENT"))
                .build();

        Map<String, Long> attendanceByStatus = dashboardQueryRepository.countAttendanceByStatus(clubId, semesterId);
        long present = statusCount(attendanceByStatus, AttendanceStatus.PRESENT.name());
        long absent = statusCount(attendanceByStatus, AttendanceStatus.ABSENT.name());
        long attendanceTotal = present + absent;

        AttendanceMetrics attendanceMetrics = AttendanceMetrics.builder()
                .presentCount(present)
                .absentCount(absent)
                .lateCount(0)
                .attendanceRate(rate(present, attendanceTotal))
                .absentRate(rate(absent, attendanceTotal))
                .aiVerifiedRecords(dashboardQueryRepository.countAiVerifiedAttendance(clubId, semesterId))
                .lowConfidenceRecords(dashboardQueryRepository.countLowConfidenceAttendance(clubId, semesterId, config.lowAiConfidence()))
                .manualConfirmedRecords(dashboardQueryRepository.countManualAttendance(clubId, semesterId))
                .sessionsMissingEvidence(dashboardQueryRepository.countSessionsMissingEvidence(clubId, semesterId))
                .attendanceByEvent(dashboardQueryRepository.attendanceByEvent(clubId, semesterId, 12).stream().map(this::toChartPoint).toList())
                .attendanceTrend(List.of())
                .frequentAbsentMembers(List.of())
                .build();

        long totalRegistrations = dashboardQueryRepository.countRegistrations(clubId, semesterId);
        long validRegistrations = dashboardQueryRepository.countRegistrationsInStatuses(clubId, semesterId, VALID_REGISTRATION_STATUSES);
        long cancelledRegistrations = dashboardQueryRepository.countRegistrationsInStatuses(clubId, semesterId, List.of(RegistrationStatus.CANCELLED));

        RegistrationMetrics registrationMetrics = RegistrationMetrics.builder()
                .totalRegistrations(totalRegistrations)
                .validRegistrations(validRegistrations)
                .cancelledRegistrations(cancelledRegistrations)
                .actualParticipants(present)
                .absentParticipants(absent)
                .walkInParticipants(dashboardQueryRepository.countWalkInRegistrations(clubId, semesterId))
                .attendanceConversionRate(rate(present, validRegistrations))
                .participantTypeDistribution(toChart(dashboardQueryRepository.countParticipantTypes(clubId, semesterId)))
                .build();

        ScoreStats scoreStats = dashboardQueryRepository.contributionScoreStats(clubId, semesterId);
        long passedMembers = dashboardQueryRepository.countContributionMembersByScore(clubId, semesterId, config.lowContributionScore(), true);
        long failedMembers = dashboardQueryRepository.countContributionMembersByScore(clubId, semesterId, config.lowContributionScore(), false);
        ContributionMetrics contributionMetrics = ContributionMetrics.builder()
                .averageScore(scale(scoreStats.average()))
                .highestScore(scale(scoreStats.highest()))
                .lowestScore(scale(scoreStats.lowest()))
                .passedMembers(passedMembers)
                .failedMembers(failedMembers)
                .unscoredMembers(Math.max(0, totalMembers - scoreStats.scoredMembers()))
                .notFinalizedScores(notFinalizedContributionEvents)
                .totalBonusPoints(scoreStats.bonusPoints())
                .totalPenaltyPoints(scoreStats.penaltyPoints())
                .appealCount(dashboardQueryRepository.countAppeals(clubId, semesterId))
                .pendingAppealCount(dashboardQueryRepository.countPendingAppeals(clubId, semesterId))
                .scoreDistribution(dashboardQueryRepository.contributionScoreDistribution(clubId, semesterId).stream().map(this::toChartPoint).toList())
                .topContributors(toAttentionItems(dashboardQueryRepository.topContributors(clubId, semesterId, 5), "MEMBER"))
                .membersNeedAttention(toAttentionItems(lowContributionRows.stream().limit(5).toList(), "MEMBER"))
                .build();

        long submittedReports = dashboardQueryRepository.countSubmittedReports(clubId, semesterId);
        long onTimeReports = dashboardQueryRepository.countOnTimeReports(clubId, semesterId, config.reportDeadlineDays());
        ReportMetrics reportMetrics = ReportMetrics.builder()
                .totalRequiredReports(completedEvents)
                .submittedReports(submittedReports)
                .missingReports(missingReportEvents)
                .onTimeReports(onTimeReports)
                .lateReports(lateReportEvents)
                .pendingReviewReports(dashboardQueryRepository.countReportsByStatus(clubId, semesterId, EventReportStatus.UPLOADED))
                .approvedReports(dashboardQueryRepository.countReportsByStatus(clubId, semesterId, EventReportStatus.APPROVED))
                .rejectedReports(dashboardQueryRepository.countReportsByStatus(clubId, semesterId, EventReportStatus.REJECTED))
                .averageProcessingHours(dashboardQueryRepository.averageReportProcessingHours(clubId, semesterId))
                .reportsNeedAttention(toAttentionItems(dashboardQueryRepository.findReportIssues(clubId, semesterId, reportOverdueCutoff, COMPLETED_EVENT_STATUSES, 10), "EVENT"))
                .build();

        Map<String, Long> recruitmentByStatus = dashboardQueryRepository.countRecruitmentByStatus(clubId, semesterId);
        long totalApplications = recruitmentByStatus.values().stream().mapToLong(Long::longValue).sum();
        long passedApplications = sumStatuses(recruitmentByStatus, "Approved", "Passed", "PASS", "APPROVED");
        RecruitmentMetrics recruitmentMetrics = RecruitmentMetrics.builder()
                .totalApplications(totalApplications)
                .draftApplications(sumStatuses(recruitmentByStatus, "Draft", "DRAFT"))
                .pendingApplications(sumStatuses(recruitmentByStatus, "Submitted", "Reviewing", "Pending", "PENDING"))
                .interviewingApplications(sumStatuses(recruitmentByStatus, "Interviewing", "INTERVIEWING"))
                .passedApplications(passedApplications)
                .rejectedApplications(sumStatuses(recruitmentByStatus, "Rejected", "REJECTED"))
                .withdrawnApplications(sumStatuses(recruitmentByStatus, "Withdrawn", "WITHDRAWN"))
                .successRate(rate(passedApplications, totalApplications))
                .statusDistribution(toChart(recruitmentByStatus))
                .build();

        long blacklistedMembers = dashboardQueryRepository.countBlacklist(clubId);
        long disciplinedBoardMembers = dashboardQueryRepository.countBoardMembersWithActiveDiscipline(clubId, semesterId);
        ViolationMetrics violationMetrics = ViolationMetrics.builder()
                .disciplinedMembers(disciplinedMembers)
                .activeViolations(disciplinedMembers)
                .expiredViolations(0)
                .semesterViolations(disciplinedMembers)
                .blacklistedMembers(blacklistedMembers)
                .disciplinedBoardMembers(disciplinedBoardMembers)
                .clubsWithoutLeader(memberMetrics.getLeaderCount() == 0 ? 1 : 0)
                .belowMinimumMembers(totalMembers < config.minimumMembers() ? 1 : 0)
                .build();

        KpiResult kpi = calculateKpi(memberMetrics, eventMetrics, attendanceMetrics, contributionMetrics, reportMetrics, violationMetrics, config.weights());

        return new DashboardCalculation(
                memberMetrics,
                eventMetrics,
                registrationMetrics,
                attendanceMetrics,
                contributionMetrics,
                reportMetrics,
                recruitmentMetrics,
                violationMetrics,
                kpi.components(),
                kpi.totalScore()
        );
    }

    private KpiResult calculateKpi(
            MemberMetrics memberMetrics,
            EventMetrics eventMetrics,
            AttendanceMetrics attendanceMetrics,
            ContributionMetrics contributionMetrics,
            ReportMetrics reportMetrics,
            ViolationMetrics violationMetrics,
            KpiWeights weights
    ) {
        return ClubDashboardCalculator.calculateKpi(
                memberMetrics,
                eventMetrics,
                attendanceMetrics,
                contributionMetrics,
                reportMetrics,
                violationMetrics,
                weights
        );
    }

    private List<DashboardWarning> buildWarnings(Integer clubId, DashboardCalculation current, DashboardCalculation previous, DashboardConfig config) {
        List<DashboardWarning> warnings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        if (current.violationMetrics().getClubsWithoutLeader() > 0) {
            warnings.add(warning("NO_VALID_LEADER", "CRITICAL", "Club has no valid Leader in this semester.", "CLUB", clubId, now, "/icpdp/personnel-reassign"));
        }
        if (current.memberMetrics().getTotalMembers() < config.minimumMembers()) {
            warnings.add(warning("LOW_MEMBER_COUNT", "HIGH", "Club has fewer members than the configured minimum.", "CLUB", clubId, now, "/icpdp/club-management"));
        }
        if (current.eventMetrics().getApprovedEvents() == 0) {
            warnings.add(warning("NO_APPROVED_EVENTS", "HIGH", "No approved events found for this semester.", "EVENT", null, now, "/icpdp/event-approval"));
        }
        if (current.reportMetrics().getMissingReports() > 0 || current.reportMetrics().getLateReports() > 0) {
            warnings.add(warning("REPORT_SLA", "HIGH", "There are missing or late event reports.", "EVENT", null, now, "/icpdp/report-review"));
        }
        if (current.attendanceMetrics().getAttendanceRate().compareTo(config.lowAttendanceRate()) < 0 && current.attendanceMetrics().getPresentCount() + current.attendanceMetrics().getAbsentCount() > 0) {
            warnings.add(warning("LOW_ATTENDANCE", "MEDIUM", "Attendance rate is below the configured threshold.", "ATTENDANCE", null, now, "/icpdp/event-approval"));
        }
        if (current.violationMetrics().getDisciplinedBoardMembers() > 0) {
            warnings.add(warning("DISCIPLINED_BOARD_MEMBER", "CRITICAL", "Leader or Vice Leader has active discipline.", "MEMBER", null, now, "/icpdp/discipline-log"));
        }
        if (previous != null) {
            BigDecimal delta = current.kpiScore().subtract(previous.kpiScore());
            if (delta.compareTo(BigDecimal.valueOf(-20)) <= 0) {
                warnings.add(warning("KPI_DROP", "HIGH", "KPI dropped by at least 20 points compared with previous semester.", "CLUB", clubId, now, "/icpdp/club-dashboard"));
            }
        }
        return warnings;
    }

    private SuggestedDecision buildSuggestedDecision(BigDecimal kpiScore, List<DashboardWarning> warnings, DashboardConfig config) {
        return ClubDashboardCalculator.buildSuggestedDecision(kpiScore, warnings, config);
    }

    private List<MetricCard> buildOverviewMetrics(DashboardCalculation current, DashboardCalculation previous, ClubEvaluationResponse latestEvaluation, SuggestedDecision suggestion) {
        List<MetricCard> cards = new ArrayList<>();
        Function<DashboardCalculation, BigDecimal> totalMembers = c -> BigDecimal.valueOf(c.memberMetrics().getTotalMembers());
        Function<DashboardCalculation, BigDecimal> activeMembers = c -> BigDecimal.valueOf(c.memberMetrics().getActiveMembers());
        Function<DashboardCalculation, BigDecimal> activeRate = c -> c.memberMetrics().getActiveMemberRate();
        Function<DashboardCalculation, BigDecimal> approvedEvents = c -> BigDecimal.valueOf(c.eventMetrics().getApprovedEvents());
        Function<DashboardCalculation, BigDecimal> completedEvents = c -> BigDecimal.valueOf(c.eventMetrics().getCompletedEvents());
        Function<DashboardCalculation, BigDecimal> eventCompletion = c -> c.eventMetrics().getEventCompletionRate();
        Function<DashboardCalculation, BigDecimal> attendanceRate = c -> c.attendanceMetrics().getAttendanceRate();
        Function<DashboardCalculation, BigDecimal> averageContribution = c -> c.contributionMetrics().getAverageScore();
        Function<DashboardCalculation, BigDecimal> overdueReports = c -> BigDecimal.valueOf(c.reportMetrics().getMissingReports() + c.reportMetrics().getLateReports());
        Function<DashboardCalculation, BigDecimal> activeViolations = c -> BigDecimal.valueOf(c.violationMetrics().getActiveViolations());
        Function<DashboardCalculation, BigDecimal> kpiScore = DashboardCalculation::kpiScore;

        cards.add(card("totalMembers", "Total members", totalMembers, current, previous, "members", "Club memberships in selected semester"));
        cards.add(card("activeMembers", "Active members", activeMembers, current, previous, "members", "Members with registration, attendance, or performance"));
        cards.add(card("activeMemberRate", "Active member rate", activeRate, current, previous, "%", "active members / total members"));
        cards.add(card("approvedEvents", "Approved events", approvedEvents, current, previous, "events", "events in approved lifecycle statuses"));
        cards.add(card("completedEvents", "Completed events", completedEvents, current, previous, "events", "events completed or later"));
        cards.add(card("eventCompletionRate", "Event completion rate", eventCompletion, current, previous, "%", "completed events / approved events"));
        cards.add(card("attendanceRate", "Attendance rate", attendanceRate, current, previous, "%", "present / attendance records"));
        cards.add(card("averageContributionScore", "Average contribution score", averageContribution, current, previous, "points", "average MemberPerformance finalPoints"));
        cards.add(card("overdueReports", "Missing or late reports", overdueReports, current, previous, "reports", "missing reports + late reports"));
        cards.add(card("activeViolations", "Active violations", activeViolations, current, previous, "violations", "active DisciplineLog rows for club members"));
        cards.add(card("clubKpiScore", "Club KPI score", kpiScore, current, previous, "points", "weighted backend KPI formula"));
        cards.add(MetricCard.builder()
                .key("evaluationStatus")
                .label("Latest evaluation")
                .value(BigDecimal.ZERO)
                .unit("")
                .status(latestEvaluation == null ? "EMPTY" : latestEvaluation.getFinalDecision())
                .note(latestEvaluation == null ? "No ICPDP evaluation saved yet" : latestEvaluation.getFinalDecision())
                .formula("latest ClubEvaluation for selected semester")
                .build());
        cards.add(MetricCard.builder()
                .key("systemSuggestion")
                .label("System suggestion")
                .value(suggestion.getKpiScore())
                .unit("points")
                .status(suggestion.getDecision())
                .note(suggestion.getDecision())
                .formula("KPI score + warning severity rules")
                .build());
        cards.add(card("kpiChange", "KPI change", kpiScore, current, previous, "points", "current KPI - previous semester KPI"));
        return cards;
    }

    private List<ComparisonMetric> buildSemesterComparison(DashboardCalculation current, DashboardCalculation previous) {
        return List.of(
                comparison("totalMembers", "Total members", BigDecimal.valueOf(current.memberMetrics().getTotalMembers()), previous == null ? null : BigDecimal.valueOf(previous.memberMetrics().getTotalMembers()), "members"),
                comparison("activeMembers", "Active members", BigDecimal.valueOf(current.memberMetrics().getActiveMembers()), previous == null ? null : BigDecimal.valueOf(previous.memberMetrics().getActiveMembers()), "members"),
                comparison("completedEvents", "Completed events", BigDecimal.valueOf(current.eventMetrics().getCompletedEvents()), previous == null ? null : BigDecimal.valueOf(previous.eventMetrics().getCompletedEvents()), "events"),
                comparison("eventCompletionRate", "Event completion rate", current.eventMetrics().getEventCompletionRate(), previous == null ? null : previous.eventMetrics().getEventCompletionRate(), "%"),
                comparison("attendanceRate", "Attendance rate", current.attendanceMetrics().getAttendanceRate(), previous == null ? null : previous.attendanceMetrics().getAttendanceRate(), "%"),
                comparison("averageContributionScore", "Average contribution", current.contributionMetrics().getAverageScore(), previous == null ? null : previous.contributionMetrics().getAverageScore(), "points"),
                comparison("activeViolations", "Active violations", BigDecimal.valueOf(current.violationMetrics().getActiveViolations()), previous == null ? null : BigDecimal.valueOf(previous.violationMetrics().getActiveViolations()), "violations"),
                comparison("kpiScore", "KPI score", current.kpiScore(), previous == null ? null : previous.kpiScore(), "points"),
                comparison("lateReports", "Late reports", BigDecimal.valueOf(current.reportMetrics().getLateReports()), previous == null ? null : BigDecimal.valueOf(previous.reportMetrics().getLateReports()), "reports")
        );
    }

    private MetricCard card(String key, String label, Function<DashboardCalculation, BigDecimal> extractor, DashboardCalculation current, DashboardCalculation previous, String unit, String formula) {
        BigDecimal currentValue = scale(extractor.apply(current));
        BigDecimal previousValue = previous == null ? null : scale(extractor.apply(previous));
        BigDecimal delta = previousValue == null ? null : scale(currentValue.subtract(previousValue));
        return MetricCard.builder()
                .key(key)
                .label(label)
                .value(currentValue)
                .unit(unit)
                .previousValue(previousValue)
                .delta(delta)
                .changePercent(changePercent(currentValue, previousValue))
                .status(statusFor(currentValue, unit))
                .formula(formula)
                .build();
    }

    private ComparisonMetric comparison(String key, String label, BigDecimal current, BigDecimal previous, String unit) {
        BigDecimal currentValue = scale(current);
        BigDecimal previousValue = previous == null ? null : scale(previous);
        BigDecimal delta = previousValue == null ? null : scale(currentValue.subtract(previousValue));
        return ComparisonMetric.builder()
                .key(key)
                .label(label)
                .currentValue(currentValue)
                .previousValue(previousValue)
                .delta(delta)
                .changePercent(changePercent(currentValue, previousValue))
                .unit(unit)
                .build();
    }

    private ClubDashboardResponse.ClubSummary mapClub(Club club) {
        return ClubDashboardResponse.ClubSummary.builder()
                .clubID(club.getClubID())
                .clubCode(club.getClubCode())
                .clubName(club.getClubName())
                .clubStatus(club.getClubStatus())
                .category(club.getCategory())
                .build();
    }

    private SemesterSummary mapSemester(Semester semester) {
        return SemesterSummary.builder()
                .semesterID(semester.getSemesterID())
                .semesterCode(semester.getSemesterCode())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .isActive(semester.getIsActive())
                .build();
    }

    private List<SelectableOption> resolveAvailableClubs(UserPrincipal currentUser, Club selectedClub) {
        if (isSystemEvaluator(currentUser)) {
            return clubRepository.findAll().stream()
                    .sorted(Comparator.comparing(Club::getClubName, Comparator.nullsLast(String::compareToIgnoreCase)))
                    .map(club -> SelectableOption.builder()
                            .value(club.getClubID())
                            .label(club.getClubName())
                            .status(club.getClubStatus())
                            .build())
                    .toList();
        }
        return List.of(SelectableOption.builder()
                .value(selectedClub.getClubID())
                .label(selectedClub.getClubName())
                .status(selectedClub.getClubStatus())
                .build());
    }

    private ClubEvaluationResponse mapEvaluation(ClubEvaluation evaluation) {
        String evaluatorName = evaluation.getEvaluatedBy() == null
                ? null
                : userRepository.findByUserIDAndIsDeletedFalse(evaluation.getEvaluatedBy())
                .map(UserAccount::getFullName)
                .orElse(null);
        return ClubEvaluationResponse.builder()
                .evaluationID(evaluation.getEvaluationID())
                .clubID(evaluation.getClubID())
                .semesterID(evaluation.getSemesterID())
                .kpiScore(evaluation.getKpiScore())
                .suggestedDecision(evaluation.getSuggestedDecision())
                .finalDecision(evaluation.getFinalDecision())
                .previousFinalDecision(evaluation.getPreviousFinalDecision())
                .overallComment(evaluation.getOverallComment())
                .strengths(evaluation.getStrengths())
                .weaknesses(evaluation.getWeaknesses())
                .improvementRequirements(evaluation.getImprovementRequirements())
                .improvementDeadline(evaluation.getImprovementDeadline())
                .decisionReason(evaluation.getDecisionReason())
                .evaluatedBy(evaluation.getEvaluatedBy())
                .evaluatedByName(evaluatorName)
                .evaluatedAt(evaluation.getEvaluatedAt())
                .createdBy(evaluation.getCreatedBy())
                .createdAt(evaluation.getCreatedAt())
                .updatedBy(evaluation.getUpdatedBy())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }

    private void applyEvaluationRequest(ClubEvaluation evaluation, ClubEvaluationRequest request, Integer actorId, boolean create) {
        if (create) {
            evaluation.setCreatedBy(actorId);
        }
        evaluation.setFinalDecision(normalizeDecision(request.getFinalDecision()));
        evaluation.setOverallComment(trimToNull(request.getOverallComment()));
        evaluation.setStrengths(trimToNull(request.getStrengths()));
        evaluation.setWeaknesses(trimToNull(request.getWeaknesses()));
        evaluation.setImprovementRequirements(trimToNull(request.getImprovementRequirements()));
        evaluation.setImprovementDeadline(request.getImprovementDeadline());
        evaluation.setDecisionReason(trimToNull(request.getDecisionReason()));
        evaluation.setEvaluatedBy(actorId);
        evaluation.setEvaluatedAt(LocalDateTime.now());
        evaluation.setUpdatedBy(actorId);
        evaluation.setUpdatedAt(LocalDateTime.now());
        evaluation.setIsDeleted(false);
    }

    private void validateEvaluationRequest(ClubEvaluationRequest request) {
        if (request == null || !StringUtils.hasText(request.getFinalDecision())) {
            throw new BusinessRuleException("finalDecision is required", HttpStatus.BAD_REQUEST);
        }
        String decision = normalizeDecision(request.getFinalDecision());
        if (!DECISIONS.contains(decision)) {
            throw new BusinessRuleException("Unsupported finalDecision", HttpStatus.BAD_REQUEST);
        }
        if (Set.of("Suspend", "Close").contains(decision) && !StringUtils.hasText(request.getDecisionReason())) {
            throw new BusinessRuleException("decisionReason is required for Suspend or Close", HttpStatus.BAD_REQUEST);
        }
        if (Set.of("Continue with Improvement Plan", "Warning").contains(decision)) {
            if (!StringUtils.hasText(request.getImprovementRequirements())) {
                throw new BusinessRuleException("improvementRequirements is required for this decision", HttpStatus.BAD_REQUEST);
            }
            if (request.getImprovementDeadline() == null) {
                throw new BusinessRuleException("improvementDeadline is required for this decision", HttpStatus.BAD_REQUEST);
            }
        }
        if (request.getImprovementDeadline() != null && request.getImprovementDeadline().isBefore(LocalDate.now())) {
            throw new BusinessRuleException("improvementDeadline cannot be in the past", HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeDecision(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalized = value.trim().replace('_', ' ').replace('-', ' ').toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "continue" -> "Continue";
            case "continue with improvement plan", "improvement plan" -> "Continue with Improvement Plan";
            case "warning" -> "Warning";
            case "suspend" -> "Suspend";
            case "close" -> "Close";
            default -> value.trim();
        };
    }

    private void requireDashboardAccess(Integer clubId, Integer semesterId, UserPrincipal currentUser) {
        if (isSystemEvaluator(currentUser)) {
            return;
        }
        Optional<ClubMembership> membership = clubMembershipRepository
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(clubId, currentUser.getUserId(), semesterId);
        boolean allowed = membership
                .map(ClubMembership::getClubRoleID)
                .filter(roleId -> roleId == 1 || roleId == 2)
                .isPresent();
        if (!allowed) {
            throw new BusinessRuleException("You do not have permission to view this club dashboard", HttpStatus.FORBIDDEN);
        }
    }

    private void requireEvaluator(UserPrincipal currentUser) {
        requireAuthenticated(currentUser);
        if (!isSystemEvaluator(currentUser)) {
            throw new BusinessRuleException("Only Admin or ICPDP can save club evaluation", HttpStatus.FORBIDDEN);
        }
    }

    private void requireAuthenticated(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException("Authentication is required", HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isSystemEvaluator(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getRoleId() == null) {
            return false;
        }
        String role = systemRoleRepository.findById(currentUser.getRoleId())
                .map(SystemRole::getRoleName)
                .orElse("");
        return "Admin".equalsIgnoreCase(role) || "ICPDP".equalsIgnoreCase(role);
    }

    private Semester resolveSemester(Integer semesterId) {
        if (semesterId != null) {
            return semesterRepository.findBySemesterIDAndIsDeletedFalse(semesterId)
                    .orElseThrow(() -> new BusinessRuleException("Semester not found", HttpStatus.NOT_FOUND));
        }
        return semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .or(() -> semesterRepository.findAll().stream()
                        .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                        .max(Comparator.comparing(Semester::getStartDate, Comparator.nullsLast(Comparator.naturalOrder()))))
                .orElseThrow(() -> new BusinessRuleException("No semester is configured", HttpStatus.NOT_FOUND));
    }

    private Optional<Semester> findPreviousSemester(Semester current) {
        return semesterRepository.findAll().stream()
                .filter(s -> !Objects.equals(s.getSemesterID(), current.getSemesterID()))
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .filter(s -> s.getEndDate() != null && current.getStartDate() != null && s.getEndDate().isBefore(current.getStartDate()))
                .max(Comparator.comparing(Semester::getEndDate));
    }

    private DashboardConfig loadConfig() {
        Map<String, BigDecimal> weights = parseDecimalConfig(
                "club.dashboard.kpi.weights",
                Map.of(
                        "eventCompletion", BigDecimal.valueOf(25),
                        "activeMember", BigDecimal.valueOf(20),
                        "attendance", BigDecimal.valueOf(20),
                        "reportOnTime", BigDecimal.valueOf(15),
                        "contribution", BigDecimal.valueOf(10),
                        "compliance", BigDecimal.valueOf(10)
                )
        );
        Map<String, BigDecimal> rules = parseDecimalConfig(
                "club.dashboard.decision.rules",
                Map.of(
                        "continueMin", BigDecimal.valueOf(80),
                        "improvementMin", BigDecimal.valueOf(60),
                        "warningMin", BigDecimal.valueOf(40)
                )
        );
        Map<String, BigDecimal> thresholds = parseDecimalConfig(
                "club.dashboard.thresholds",
                Map.of(
                        "minimumMembers", BigDecimal.valueOf(5),
                        "reportDeadlineDays", BigDecimal.valueOf(5),
                        "lowContributionScore", BigDecimal.valueOf(50),
                        "lowAttendanceRate", BigDecimal.valueOf(50),
                        "lowAiConfidence", BigDecimal.valueOf(0.60)
                )
        );
        String criticalDecision = systemConfigRepository.findByConfigKey("club.dashboard.decision.rules")
                .map(config -> parseTextConfig(config.getConfigValue()).getOrDefault("criticalWarningDecision", "Suspend"))
                .orElse("Suspend");

        return new DashboardConfig(
                new KpiWeights(
                        weights.get("eventCompletion"),
                        weights.get("activeMember"),
                        weights.get("attendance"),
                        weights.get("reportOnTime"),
                        weights.get("contribution"),
                        weights.get("compliance")
                ),
                rules.get("continueMin"),
                rules.get("improvementMin"),
                rules.get("warningMin"),
                criticalDecision,
                thresholds.get("minimumMembers").intValue(),
                thresholds.get("reportDeadlineDays").intValue(),
                thresholds.get("lowContributionScore"),
                thresholds.get("lowAttendanceRate"),
                thresholds.get("lowAiConfidence")
        );
    }

    private Map<String, BigDecimal> parseDecimalConfig(String key, Map<String, BigDecimal> defaults) {
        Map<String, BigDecimal> result = new LinkedHashMap<>(defaults);
        systemConfigRepository.findByConfigKey(key)
                .map(config -> parseTextConfig(config.getConfigValue()))
                .ifPresent(values -> values.forEach((name, value) -> {
                    try {
                        result.put(name, new BigDecimal(value));
                    } catch (NumberFormatException ignored) {
                        // Keep default for malformed config values.
                    }
                }));
        return result;
    }

    private Map<String, String> parseTextConfig(String value) {
        Map<String, String> result = new LinkedHashMap<>();
        if (!StringUtils.hasText(value)) {
            return result;
        }
        for (String entry : value.split(";")) {
            String[] parts = entry.split("=", 2);
            if (parts.length == 2 && StringUtils.hasText(parts[0])) {
                result.put(parts[0].trim(), parts[1].trim());
            }
        }
        return result;
    }

    private DashboardWarning warning(String type, String severity, String message, String objectType, Integer objectId, LocalDateTime occurredAt, String detailUrl) {
        return DashboardWarning.builder()
                .type(type)
                .severity(severity)
                .message(message)
                .relatedObjectType(objectType)
                .relatedObjectID(objectId)
                .occurredAt(occurredAt)
                .status("OPEN")
                .detailUrl(detailUrl)
                .build();
    }

    private List<AttentionItem> mergeAttentionRows(List<AttentionRow> first, List<AttentionRow> second) {
        List<AttentionRow> merged = new ArrayList<>();
        merged.addAll(first);
        merged.addAll(second);
        return toAttentionItems(merged.stream().limit(10).toList(), "MEMBER");
    }

    private List<AttentionItem> toAttentionItems(List<AttentionRow> rows, String type) {
        return rows.stream()
                .map(row -> AttentionItem.builder()
                        .id(row.id())
                        .title(row.title())
                        .subtitle(row.subtitle())
                        .value(scale(row.value()))
                        .status(row.status())
                        .reason(row.reason())
                        .detailUrl(resolveDetailUrl(type, row.id()))
                        .build())
                .toList();
    }

    private String resolveDetailUrl(String type, Integer id) {
        if ("EVENT".equals(type) && id != null) {
            return "/events/" + id;
        }
        if ("MEMBER".equals(type)) {
            return "/icpdp/personnel-reassign";
        }
        return null;
    }

    private List<ChartPoint> toChart(Map<String, Long> values) {
        return values.entrySet().stream()
                .map(entry -> ChartPoint.builder()
                        .label(entry.getKey())
                        .value(BigDecimal.valueOf(entry.getValue()))
                        .secondaryValue(null)
                        .build())
                .toList();
    }

    private List<ChartPoint> monthlyToChart(List<MonthlyCount> values) {
        return values.stream()
                .map(item -> ChartPoint.builder()
                        .label(String.format(Locale.ROOT, "%04d-%02d", item.year(), item.month()))
                        .value(BigDecimal.valueOf(item.count()))
                        .build())
                .toList();
    }

    private ChartPoint toChartPoint(CountItem item) {
        return ChartPoint.builder()
                .label(item.label())
                .value(BigDecimal.valueOf(item.count()))
                .build();
    }

    private long roleCount(Map<String, Long> values, String roleName) {
        return values.entrySet().stream()
                .filter(entry -> roleName.equalsIgnoreCase(entry.getKey()))
                .mapToLong(Map.Entry::getValue)
                .sum();
    }

    private long statusCount(Map<String, Long> values, String status) {
        return values.entrySet().stream()
                .filter(entry -> status.equalsIgnoreCase(entry.getKey()))
                .mapToLong(Map.Entry::getValue)
                .sum();
    }

    private long sumStatuses(Map<String, Long> values, String... statuses) {
        Set<String> wanted = java.util.Arrays.stream(statuses)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
        return values.entrySet().stream()
                .filter(entry -> wanted.contains(entry.getKey().toLowerCase(Locale.ROOT)))
                .mapToLong(Map.Entry::getValue)
                .sum();
    }

    private BigDecimal rate(long numerator, long denominator) {
        return ClubDashboardCalculator.rate(numerator, denominator);
    }

    private BigDecimal changePercent(BigDecimal current, BigDecimal previous) {
        return ClubDashboardCalculator.changePercent(current, previous);
    }

    private BigDecimal clamp(BigDecimal value) {
        return ClubDashboardCalculator.clamp(value);
    }

    private BigDecimal scale(BigDecimal value) {
        return ClubDashboardCalculator.scale(value);
    }

    private String statusFor(BigDecimal value, String unit) {
        return ClubDashboardCalculator.statusFor(value, unit);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private record DashboardCalculation(
            MemberMetrics memberMetrics,
            EventMetrics eventMetrics,
            RegistrationMetrics registrationMetrics,
            AttendanceMetrics attendanceMetrics,
            ContributionMetrics contributionMetrics,
            ReportMetrics reportMetrics,
            RecruitmentMetrics recruitmentMetrics,
            ViolationMetrics violationMetrics,
            List<KpiComponent> kpiBreakdown,
            BigDecimal kpiScore
    ) {}

}
