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
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ClubDashboardCalculatorTest {

    @Test
    void rateReturnsZeroWhenDenominatorIsZero() {
        assertEquals(bd("0.00"), ClubDashboardCalculator.rate(5, 0));
        assertEquals(bd("33.33"), ClubDashboardCalculator.rate(1, 3));
    }

    @Test
    void changePercentReturnsNullWhenPreviousValueIsZero() {
        assertNull(ClubDashboardCalculator.changePercent(bd("25"), BigDecimal.ZERO));
        assertEquals(bd("50.00"), ClubDashboardCalculator.changePercent(bd("15"), bd("10")));
    }

    @Test
    void calculateKpiUsesWeightsAndClampsContributionScore() {
        ClubDashboardCalculator.KpiResult result = ClubDashboardCalculator.calculateKpi(
                MemberMetrics.builder().activeMemberRate(bd("80")).build(),
                EventMetrics.builder().eventCompletionRate(bd("50")).build(),
                AttendanceMetrics.builder().attendanceRate(bd("75")).build(),
                ContributionMetrics.builder().averageScore(bd("120")).build(),
                ReportMetrics.builder().onTimeReports(4).totalRequiredReports(5).build(),
                ViolationMetrics.builder().activeViolations(2).blacklistedMembers(1).build(),
                weights()
        );

        assertEquals(bd("73.00"), result.totalScore());
        assertEquals(6, result.components().size());
        assertEquals(bd("10.00"), component(result.components(), "contribution").getActualScore());
        assertEquals(bd("7.50"), component(result.components(), "compliance").getActualScore());
    }

    @Test
    void suggestedDecisionUsesConfiguredThresholds() {
        assertEquals("Continue", decisionFor("80").getDecision());
        assertEquals("Continue with Improvement Plan", decisionFor("60").getDecision());
        assertEquals("Warning", decisionFor("40").getDecision());
        assertEquals("Suspend", decisionFor("39.99").getDecision());
    }

    @Test
    void suggestedDecisionUsesCriticalWarningBeforeKpiScore() {
        DashboardWarning warning = DashboardWarning.builder()
                .type("NO_VALID_LEADER")
                .severity("CRITICAL")
                .message("Club has no valid Leader in this semester.")
                .build();

        SuggestedDecision decision = ClubDashboardCalculator.buildSuggestedDecision(
                bd("95"),
                List.of(warning),
                config("Close")
        );

        assertEquals("Close", decision.getDecision());
        assertEquals(List.of("NO_VALID_LEADER"), decision.getUnmetCriteria());
        assertEquals(2, decision.getReasons().size());
    }

    private SuggestedDecision decisionFor(String score) {
        return ClubDashboardCalculator.buildSuggestedDecision(bd(score), List.of(), config("Suspend"));
    }

    private static KpiComponent component(List<KpiComponent> components, String key) {
        return components.stream()
                .filter(component -> key.equals(component.getKey()))
                .findFirst()
                .orElseThrow();
    }

    private static ClubDashboardCalculator.KpiWeights weights() {
        return new ClubDashboardCalculator.KpiWeights(
                bd("25"),
                bd("20"),
                bd("20"),
                bd("15"),
                bd("10"),
                bd("10")
        );
    }

    private static ClubDashboardCalculator.DashboardConfig config(String criticalWarningDecision) {
        return new ClubDashboardCalculator.DashboardConfig(
                weights(),
                bd("80"),
                bd("60"),
                bd("40"),
                criticalWarningDecision,
                5,
                5,
                bd("50"),
                bd("50"),
                bd("0.60")
        );
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
