package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubDashboardResponse {
    private ClubSummary club;
    private SemesterSummary semester;
    private SemesterSummary previousSemester;
    private List<SelectableOption> availableClubs;
    private List<SemesterSummary> availableSemesters;
    private List<MetricCard> overviewMetrics;
    private MemberMetrics memberMetrics;
    private EventMetrics eventMetrics;
    private RegistrationMetrics registrationMetrics;
    private AttendanceMetrics attendanceMetrics;
    private ContributionMetrics contributionMetrics;
    private ReportMetrics reportMetrics;
    private RecruitmentMetrics recruitmentMetrics;
    private ViolationMetrics violationMetrics;
    private List<KpiComponent> kpiBreakdown;
    private List<ComparisonMetric> semesterComparison;
    private List<DashboardWarning> warnings;
    private SuggestedDecision suggestedDecision;
    private ClubEvaluationResponse latestEvaluation;
    private List<ClubEvaluationResponse> evaluationHistory;
    private LocalDateTime lastUpdatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClubSummary {
        private Integer clubID;
        private String clubCode;
        private String clubName;
        private String clubStatus;
        private String category;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SemesterSummary {
        private Integer semesterID;
        private String semesterCode;
        private LocalDate startDate;
        private LocalDate endDate;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SelectableOption {
        private Integer value;
        private String label;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricCard {
        private String key;
        private String label;
        private BigDecimal value;
        private String unit;
        private BigDecimal previousValue;
        private BigDecimal delta;
        private BigDecimal changePercent;
        private String status;
        private String formula;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberMetrics {
        private long totalMembers;
        private long activeMembers;
        private BigDecimal activeMemberRate;
        private long leaderCount;
        private long viceLeaderCount;
        private long memberCount;
        private long newMembers;
        private long inactiveMembers;
        private long disciplinedMembers;
        private long lowContributionMembers;
        private long noEventParticipationMembers;
        private BigDecimal retentionRate;
        private BigDecimal eventParticipationRate;
        private List<ChartPoint> roleDistribution;
        private List<ChartPoint> memberTrend;
        private List<AttentionItem> membersNeedAttention;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventMetrics {
        private long totalEvents;
        private long approvedEvents;
        private long completedEvents;
        private long cancelledEvents;
        private long missingReportEvents;
        private long lateReportEvents;
        private long notFinalizedContributionEvents;
        private BigDecimal eventCompletionRate;
        private BigDecimal cancellationRate;
        private List<ChartPoint> statusDistribution;
        private List<ChartPoint> monthlyTrend;
        private List<AttentionItem> eventsNeedAttention;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegistrationMetrics {
        private long totalRegistrations;
        private long validRegistrations;
        private long cancelledRegistrations;
        private long actualParticipants;
        private long absentParticipants;
        private long walkInParticipants;
        private BigDecimal attendanceConversionRate;
        private List<ChartPoint> participantTypeDistribution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceMetrics {
        private long presentCount;
        private long absentCount;
        private long lateCount;
        private BigDecimal attendanceRate;
        private BigDecimal absentRate;
        private long aiVerifiedRecords;
        private long lowConfidenceRecords;
        private long manualConfirmedRecords;
        private long sessionsMissingEvidence;
        private List<ChartPoint> attendanceByEvent;
        private List<ChartPoint> attendanceTrend;
        private List<AttentionItem> frequentAbsentMembers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContributionMetrics {
        private BigDecimal averageScore;
        private BigDecimal highestScore;
        private BigDecimal lowestScore;
        private long passedMembers;
        private long failedMembers;
        private long unscoredMembers;
        private long notFinalizedScores;
        private long totalBonusPoints;
        private long totalPenaltyPoints;
        private long appealCount;
        private long pendingAppealCount;
        private List<ChartPoint> scoreDistribution;
        private List<AttentionItem> topContributors;
        private List<AttentionItem> membersNeedAttention;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportMetrics {
        private long totalRequiredReports;
        private long submittedReports;
        private long missingReports;
        private long onTimeReports;
        private long lateReports;
        private long pendingReviewReports;
        private long approvedReports;
        private long rejectedReports;
        private BigDecimal averageProcessingHours;
        private List<AttentionItem> reportsNeedAttention;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecruitmentMetrics {
        private long totalApplications;
        private long draftApplications;
        private long pendingApplications;
        private long interviewingApplications;
        private long passedApplications;
        private long rejectedApplications;
        private long withdrawnApplications;
        private BigDecimal successRate;
        private List<ChartPoint> statusDistribution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViolationMetrics {
        private long disciplinedMembers;
        private long activeViolations;
        private long expiredViolations;
        private long semesterViolations;
        private long blacklistedMembers;
        private long disciplinedBoardMembers;
        private long clubsWithoutLeader;
        private long belowMinimumMembers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiComponent {
        private String key;
        private String label;
        private BigDecimal weight;
        private BigDecimal maxScore;
        private BigDecimal actualScore;
        private BigDecimal deductedScore;
        private String formula;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComparisonMetric {
        private String key;
        private String label;
        private BigDecimal currentValue;
        private BigDecimal previousValue;
        private BigDecimal delta;
        private BigDecimal changePercent;
        private String unit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardWarning {
        private String type;
        private String severity;
        private String message;
        private String relatedObjectType;
        private Integer relatedObjectID;
        private LocalDateTime occurredAt;
        private String status;
        private String detailUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedDecision {
        private String decision;
        private BigDecimal kpiScore;
        private List<String> reasons;
        private List<DashboardWarning> impactedWarnings;
        private List<String> unmetCriteria;
        private String confidenceNote;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartPoint {
        private String label;
        private BigDecimal value;
        private BigDecimal secondaryValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttentionItem {
        private Integer id;
        private String title;
        private String subtitle;
        private BigDecimal value;
        private String status;
        private String reason;
        private String detailUrl;
    }
}
