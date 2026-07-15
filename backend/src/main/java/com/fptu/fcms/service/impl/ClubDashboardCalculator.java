package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.ClubDashboardResponse.AttendanceMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ContributionMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.DashboardWarning;
import com.fptu.fcms.dto.response.ClubDashboardResponse.EventMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.KpiComponent;
import com.fptu.fcms.dto.response.ClubDashboardResponse.MemberMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ReportMetrics;
import com.fptu.fcms.dto.response.ClubDashboardResponse.SuggestedDecision;
import com.fptu.fcms.dto.response.ClubDashboardResponse.ViolationMetrics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

final class ClubDashboardCalculator {

    private ClubDashboardCalculator() {
    }

    static KpiResult calculateKpi(
            MemberMetrics memberMetrics,
            EventMetrics eventMetrics,
            AttendanceMetrics attendanceMetrics,
            ContributionMetrics contributionMetrics,
            ReportMetrics reportMetrics,
            ViolationMetrics violationMetrics,
            KpiWeights weights
    ) {
        List<KpiComponent> components = new ArrayList<>();
        addComponent(components, "eventCompletion", "Event completion", weights.eventCompletion(), eventMetrics.getEventCompletionRate(), "completed approved events / approved events");
        addComponent(components, "activeMember", "Active members", weights.activeMember(), memberMetrics.getActiveMemberRate(), "active members / total members");
        addComponent(components, "attendance", "Attendance", weights.attendance(), attendanceMetrics.getAttendanceRate(), "(present) / attendance records");
        addComponent(components, "reportOnTime", "On-time reports", weights.reportOnTime(), rate(reportMetrics.getOnTimeReports(), reportMetrics.getTotalRequiredReports()), "on-time reports / required reports");
        addComponent(components, "contribution", "Contribution", weights.contribution(), clamp(contributionMetrics.getAverageScore()), "average final contribution score normalized to 100");

        BigDecimal complianceRate = BigDecimal.valueOf(100)
                .subtract(BigDecimal.valueOf(violationMetrics.getActiveViolations()).multiply(BigDecimal.TEN))
                .subtract(BigDecimal.valueOf(violationMetrics.getBlacklistedMembers()).multiply(BigDecimal.valueOf(5)))
                .max(BigDecimal.ZERO);
        addComponent(components, "compliance", "Compliance", weights.compliance(), complianceRate, "100 - active violations penalties");

        BigDecimal total = components.stream()
                .map(KpiComponent::getActualScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new KpiResult(scale(total), components);
    }

    static SuggestedDecision buildSuggestedDecision(BigDecimal kpiScore, List<DashboardWarning> warnings, DashboardConfig config) {
        boolean hasCritical = warnings.stream().anyMatch(w -> "CRITICAL".equalsIgnoreCase(w.getSeverity()));
        String decision;
        if (hasCritical) {
            decision = config.criticalWarningDecision();
        } else if (kpiScore.compareTo(config.continueMin()) >= 0) {
            decision = "Continue";
        } else if (kpiScore.compareTo(config.improvementMin()) >= 0) {
            decision = "Continue with Improvement Plan";
        } else if (kpiScore.compareTo(config.warningMin()) >= 0) {
            decision = "Warning";
        } else {
            decision = "Suspend";
        }

        List<String> reasons = new ArrayList<>();
        reasons.add("KPI score: " + scale(kpiScore));
        warnings.stream().limit(3).forEach(w -> reasons.add(w.getMessage()));

        List<String> unmet = warnings.stream()
                .map(DashboardWarning::getType)
                .distinct()
                .toList();

        String note = warnings.isEmpty()
                ? "High confidence. No major warning generated from available data."
                : "Medium confidence. Review warnings and data gaps before final decision.";

        return SuggestedDecision.builder()
                .decision(decision)
                .kpiScore(scale(kpiScore))
                .reasons(reasons)
                .impactedWarnings(warnings)
                .unmetCriteria(unmet)
                .confidenceNote(note)
                .build();
    }

    static BigDecimal rate(long numerator, long denominator) {
        if (denominator <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return scale(BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), 4, RoundingMode.HALF_UP));
    }

    static BigDecimal changePercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return scale(current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous.abs(), 4, RoundingMode.HALF_UP));
    }

    static BigDecimal clamp(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    static BigDecimal scale(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    static String statusFor(BigDecimal value, String unit) {
        if ("%".equals(unit) || "points".equals(unit)) {
            if (value.compareTo(BigDecimal.valueOf(80)) >= 0) {
                return "GOOD";
            }
            if (value.compareTo(BigDecimal.valueOf(60)) >= 0) {
                return "WATCH";
            }
            return "RISK";
        }
        return "INFO";
    }

    private static void addComponent(List<KpiComponent> components, String key, String label, BigDecimal weight, BigDecimal achievedRate, String formula) {
        BigDecimal actual = scale(clamp(achievedRate).multiply(weight).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        components.add(KpiComponent.builder()
                .key(key)
                .label(label)
                .weight(scale(weight))
                .maxScore(scale(weight))
                .actualScore(actual)
                .deductedScore(scale(weight.subtract(actual).max(BigDecimal.ZERO)))
                .formula(formula)
                .build());
    }

    record KpiResult(BigDecimal totalScore, List<KpiComponent> components) {}

    record KpiWeights(
            BigDecimal eventCompletion,
            BigDecimal activeMember,
            BigDecimal attendance,
            BigDecimal reportOnTime,
            BigDecimal contribution,
            BigDecimal compliance
    ) {}

    record DashboardConfig(
            KpiWeights weights,
            BigDecimal continueMin,
            BigDecimal improvementMin,
            BigDecimal warningMin,
            String criticalWarningDecision,
            int minimumMembers,
            int reportDeadlineDays,
            BigDecimal lowContributionScore,
            BigDecimal lowAttendanceRate,
            BigDecimal lowAiConfidence
    ) {}
}
