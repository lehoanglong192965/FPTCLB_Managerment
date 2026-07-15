package com.fptu.fcms.repository;

import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class ClubDashboardQueryRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public record CountItem(String label, long count) {}
    public record AttentionRow(Integer id, String title, String subtitle, BigDecimal value, String status, String reason) {}
    public record ScoreStats(BigDecimal average, BigDecimal highest, BigDecimal lowest, long bonusPoints, long penaltyPoints, long scoredMembers) {}
    public record MonthlyCount(int year, int month, long count) {}

    public long countMembers(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(m)
                FROM ClubMembership m
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                """, params(clubId, semesterId));
    }

    public Map<String, Long> countMembersByRole(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT COALESCE(r.roleName, 'Member'), COUNT(m)
                FROM ClubMembership m
                LEFT JOIN ClubRole r ON r.clubRoleID = m.clubRoleID AND r.isDeleted = false
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                GROUP BY r.roleName
                """, params(clubId, semesterId));
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(String.valueOf(row[0]), toLong(row[1]));
        }
        return result;
    }

    public long countNewMembers(Integer clubId, Integer semesterId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return count("""
                SELECT COUNT(m)
                FROM ClubMembership m
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                  AND m.joinedDate BETWEEN :startDate AND :endDate
                """, params);
    }

    public long countActiveMembers(Integer clubId, Integer semesterId, Collection<RegistrationStatus> validStatuses) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("validStatuses", validStatuses);
        params.put("present", AttendanceStatus.PRESENT);
        return count("""
                SELECT COUNT(DISTINCT m.userID)
                FROM ClubMembership m
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                  AND (
                    EXISTS (
                        SELECT er.registrationID
                        FROM EventRegistration er
                        JOIN Event e ON e.eventID = er.eventID
                        WHERE e.clubID = :clubId
                          AND e.semesterID = :semesterId
                          AND e.isDeleted = false
                          AND er.isDeleted = false
                          AND er.userID = m.userID
                          AND er.registrationStatus IN :validStatuses
                    )
                    OR EXISTS (
                        SELECT ar.recordID
                        FROM AttendanceRecord ar
                        JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                        JOIN Event e2 ON e2.eventID = s.eventID
                        WHERE e2.clubID = :clubId
                          AND e2.semesterID = :semesterId
                          AND e2.isDeleted = false
                          AND s.isDeleted = false
                          AND ar.isDeleted = false
                          AND ar.userID = m.userID
                          AND ar.attendanceStatus = :present
                    )
                    OR EXISTS (
                        SELECT mp.performanceID
                        FROM MemberPerformance mp
                        JOIN Event e3 ON e3.eventID = mp.eventID
                        WHERE mp.clubID = :clubId
                          AND e3.semesterID = :semesterId
                          AND e3.isDeleted = false
                          AND mp.isDeleted = false
                          AND mp.userID = m.userID
                    )
                  )
                """, params);
    }

    public long countMembersWithEventParticipation(Integer clubId, Integer semesterId, Collection<RegistrationStatus> validStatuses) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("validStatuses", validStatuses);
        params.put("present", AttendanceStatus.PRESENT);
        return count("""
                SELECT COUNT(DISTINCT m.userID)
                FROM ClubMembership m
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                  AND (
                    EXISTS (
                        SELECT er.registrationID
                        FROM EventRegistration er
                        JOIN Event e ON e.eventID = er.eventID
                        WHERE e.clubID = :clubId
                          AND e.semesterID = :semesterId
                          AND e.isDeleted = false
                          AND er.isDeleted = false
                          AND er.userID = m.userID
                          AND er.registrationStatus IN :validStatuses
                    )
                    OR EXISTS (
                        SELECT ar.recordID
                        FROM AttendanceRecord ar
                        JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                        JOIN Event e2 ON e2.eventID = s.eventID
                        WHERE e2.clubID = :clubId
                          AND e2.semesterID = :semesterId
                          AND e2.isDeleted = false
                          AND s.isDeleted = false
                          AND ar.isDeleted = false
                          AND ar.userID = m.userID
                          AND ar.attendanceStatus = :present
                    )
                  )
                """, params);
    }

    public long countMembersWithActiveDiscipline(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(DISTINCT m.userID)
                FROM ClubMembership m
                JOIN DisciplineLog d ON d.userID = m.userID
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                  AND d.semesterID = :semesterId
                  AND d.isDeleted = false
                  AND LOWER(d.disciplineStatus) = 'active'
                """, params(clubId, semesterId));
    }

    public long countBoardMembersWithActiveDiscipline(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(DISTINCT m.userID)
                FROM ClubMembership m
                JOIN DisciplineLog d ON d.userID = m.userID
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.clubRoleID IN (1, 2)
                  AND m.isDeleted = false
                  AND d.semesterID = :semesterId
                  AND d.isDeleted = false
                  AND LOWER(d.disciplineStatus) = 'active'
                """, params(clubId, semesterId));
    }

    public List<AttentionRow> findLowContributionMembers(Integer clubId, Integer semesterId, BigDecimal threshold, int limit) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("threshold", threshold.doubleValue());
        List<Object[]> rows = rows("""
                SELECT u.userID, u.fullName, u.email, AVG(COALESCE(mp.finalPoints, 0))
                FROM MemberPerformance mp
                JOIN Event e ON e.eventID = mp.eventID
                JOIN UserAccount u ON u.userID = mp.userID
                WHERE mp.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND mp.isDeleted = false
                  AND e.isDeleted = false
                  AND u.isDeleted = false
                GROUP BY u.userID, u.fullName, u.email
                HAVING AVG(COALESCE(mp.finalPoints, 0)) < :threshold
                ORDER BY AVG(COALESCE(mp.finalPoints, 0)) ASC
                """, params, limit);
        return rows.stream()
                .map(row -> new AttentionRow(
                        (Integer) row[0],
                        stringOrDash(row[1]),
                        stringOrDash(row[2]),
                        toBigDecimal(row[3]),
                        "LOW_SCORE",
                        "Average contribution below threshold"
                ))
                .toList();
    }

    public List<AttentionRow> findMembersWithoutParticipation(
            Integer clubId,
            Integer semesterId,
            Collection<RegistrationStatus> validStatuses,
            int limit
    ) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("validStatuses", validStatuses);
        params.put("present", AttendanceStatus.PRESENT);
        List<Object[]> rows = rows("""
                SELECT u.userID, u.fullName, u.email
                FROM ClubMembership m
                JOIN UserAccount u ON u.userID = m.userID
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                  AND u.isDeleted = false
                  AND NOT EXISTS (
                    SELECT er.registrationID
                    FROM EventRegistration er
                    JOIN Event e ON e.eventID = er.eventID
                    WHERE e.clubID = :clubId
                      AND e.semesterID = :semesterId
                      AND e.isDeleted = false
                      AND er.isDeleted = false
                      AND er.userID = m.userID
                      AND er.registrationStatus IN :validStatuses
                  )
                  AND NOT EXISTS (
                    SELECT ar.recordID
                    FROM AttendanceRecord ar
                    JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                    JOIN Event e2 ON e2.eventID = s.eventID
                    WHERE e2.clubID = :clubId
                      AND e2.semesterID = :semesterId
                      AND e2.isDeleted = false
                      AND s.isDeleted = false
                      AND ar.isDeleted = false
                      AND ar.userID = m.userID
                      AND ar.attendanceStatus = :present
                  )
                ORDER BY u.fullName ASC
                """, params, limit);
        return rows.stream()
                .map(row -> new AttentionRow(
                        (Integer) row[0],
                        stringOrDash(row[1]),
                        stringOrDash(row[2]),
                        BigDecimal.ZERO,
                        "NO_ACTIVITY",
                        "No event registration or present attendance in semester"
                ))
                .toList();
    }

    public long countEvents(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(e)
                FROM Event e
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                """, params(clubId, semesterId));
    }

    public Map<String, Long> countEventsByStatus(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT e.eventStatus, COUNT(e)
                FROM Event e
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                GROUP BY e.eventStatus
                """, params(clubId, semesterId));
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(row[0] == null ? "UNKNOWN" : String.valueOf(row[0]), toLong(row[1]));
        }
        return result;
    }

    public long countEventsInStatuses(Integer clubId, Integer semesterId, Collection<EventStatus> statuses) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("statuses", statuses);
        return count("""
                SELECT COUNT(e)
                FROM Event e
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND e.eventStatus IN :statuses
                """, params);
    }

    public long countEventsMissingReport(Integer clubId, Integer semesterId, LocalDateTime now, Collection<EventStatus> reportableStatuses) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("now", now);
        params.put("statuses", reportableStatuses);
        return count("""
                SELECT COUNT(e)
                FROM Event e
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND e.endDate < :now
                  AND e.eventStatus IN :statuses
                  AND NOT EXISTS (
                    SELECT r.reportID
                    FROM EventReport r
                    WHERE r.eventID = e.eventID
                      AND r.isDeleted = false
                  )
                """, params);
    }

    public long countLateReports(Integer clubId, Integer semesterId, int deadlineDays) {
        return nativeCount("""
                SELECT COUNT(*)
                FROM dbo.EventReport r
                INNER JOIN dbo.[Event] e ON e.eventID = r.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = 0
                  AND r.isDeleted = 0
                  AND r.uploadedAt IS NOT NULL
                  AND e.endDate IS NOT NULL
                  AND r.uploadedAt > DATEADD(day, :deadlineDays, e.endDate)
                """, Map.of("clubId", clubId, "semesterId", semesterId, "deadlineDays", deadlineDays));
    }

    public long countOnTimeReports(Integer clubId, Integer semesterId, int deadlineDays) {
        return nativeCount("""
                SELECT COUNT(*)
                FROM dbo.EventReport r
                INNER JOIN dbo.[Event] e ON e.eventID = r.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = 0
                  AND r.isDeleted = 0
                  AND r.uploadedAt IS NOT NULL
                  AND e.endDate IS NOT NULL
                  AND r.uploadedAt <= DATEADD(day, :deadlineDays, e.endDate)
                """, Map.of("clubId", clubId, "semesterId", semesterId, "deadlineDays", deadlineDays));
    }

    public BigDecimal averageReportProcessingHours(Integer clubId, Integer semesterId) {
        Number value = nativeNumber("""
                SELECT AVG(CAST(DATEDIFF(hour, r.uploadedAt, COALESCE(r.approvedAt, r.rejectedAt)) AS FLOAT))
                FROM dbo.EventReport r
                INNER JOIN dbo.[Event] e ON e.eventID = r.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = 0
                  AND r.isDeleted = 0
                  AND r.uploadedAt IS NOT NULL
                  AND COALESCE(r.approvedAt, r.rejectedAt) IS NOT NULL
                """, Map.of("clubId", clubId, "semesterId", semesterId));
        return toBigDecimal(value);
    }

    public long countReportsByStatus(Integer clubId, Integer semesterId, EventReportStatus status) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("status", status);
        return count("""
                SELECT COUNT(r)
                FROM EventReport r
                JOIN Event e ON e.eventID = r.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND r.isDeleted = false
                  AND r.status = :status
                """, params);
    }

    public long countSubmittedReports(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(r)
                FROM EventReport r
                JOIN Event e ON e.eventID = r.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND r.isDeleted = false
                """, params(clubId, semesterId));
    }

    public long countContributionBatchesNotFinalized(Integer clubId, Integer semesterId) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("finalized", ContributionBatchStatus.FINALIZED);
        return count("""
                SELECT COUNT(b)
                FROM ContributionBatch b
                WHERE b.clubID = :clubId
                  AND b.semesterID = :semesterId
                  AND b.isDeleted = false
                  AND b.status <> :finalized
                """, params);
    }

    public long countRegistrations(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(er)
                FROM EventRegistration er
                JOIN Event e ON e.eventID = er.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND er.isDeleted = false
                """, params(clubId, semesterId));
    }

    public long countRegistrationsInStatuses(Integer clubId, Integer semesterId, Collection<RegistrationStatus> statuses) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("statuses", statuses);
        return count("""
                SELECT COUNT(er)
                FROM EventRegistration er
                JOIN Event e ON e.eventID = er.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND er.isDeleted = false
                  AND er.registrationStatus IN :statuses
                """, params);
    }

    public long countWalkInRegistrations(Integer clubId, Integer semesterId) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("walkIn", com.fptu.fcms.enums.RegistrationChannel.WALK_IN);
        return count("""
                SELECT COUNT(er)
                FROM EventRegistration er
                JOIN Event e ON e.eventID = er.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND er.isDeleted = false
                  AND er.registrationChannel = :walkIn
                """, params);
    }

    public Map<String, Long> countParticipantTypes(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT er.participantType, COUNT(er)
                FROM EventRegistration er
                JOIN Event e ON e.eventID = er.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND er.isDeleted = false
                GROUP BY er.participantType
                """, params(clubId, semesterId));
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(String.valueOf(row[0]), toLong(row[1]));
        }
        return result;
    }

    public Map<String, Long> countAttendanceByStatus(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT ar.attendanceStatus, COUNT(ar)
                FROM AttendanceRecord ar
                JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                JOIN Event e ON e.eventID = s.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND s.isDeleted = false
                  AND ar.isDeleted = false
                GROUP BY ar.attendanceStatus
                """, params(clubId, semesterId));
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(row[0] == null ? "UNKNOWN" : String.valueOf(row[0]), toLong(row[1]));
        }
        return result;
    }

    public long countAttendanceRecords(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(ar)
                FROM AttendanceRecord ar
                JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                JOIN Event e ON e.eventID = s.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND s.isDeleted = false
                  AND ar.isDeleted = false
                """, params(clubId, semesterId));
    }

    public long countAiVerifiedAttendance(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(ar)
                FROM AttendanceRecord ar
                JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                JOIN Event e ON e.eventID = s.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND s.isDeleted = false
                  AND ar.isDeleted = false
                  AND ar.isVerifiedByAI = true
                """, params(clubId, semesterId));
    }

    public long countLowConfidenceAttendance(Integer clubId, Integer semesterId, BigDecimal threshold) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("threshold", threshold);
        return count("""
                SELECT COUNT(ar)
                FROM AttendanceRecord ar
                JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                JOIN Event e ON e.eventID = s.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND s.isDeleted = false
                  AND ar.isDeleted = false
                  AND ar.aiMatchConfidence IS NOT NULL
                  AND ar.aiMatchConfidence < :threshold
                """, params);
    }

    public long countManualAttendance(Integer clubId, Integer semesterId) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("manual", CheckInMethod.MANUAL);
        return count("""
                SELECT COUNT(ar)
                FROM AttendanceRecord ar
                JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                JOIN Event e ON e.eventID = s.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND s.isDeleted = false
                  AND ar.isDeleted = false
                  AND ar.checkInMethod = :manual
                """, params);
    }

    public long countSessionsMissingEvidence(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(s)
                FROM AttendanceSession s
                JOIN Event e ON e.eventID = s.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND s.isDeleted = false
                  AND (s.evidenceProofUrl IS NULL OR s.evidenceProofUrl = '')
                """, params(clubId, semesterId));
    }

    public List<CountItem> attendanceByEvent(Integer clubId, Integer semesterId, int limit) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("present", AttendanceStatus.PRESENT);
        List<Object[]> rows = rows("""
                SELECT e.eventName, SUM(CASE WHEN ar.attendanceStatus = :present THEN 1 ELSE 0 END)
                FROM AttendanceRecord ar
                JOIN AttendanceSession s ON s.sessionID = ar.sessionID
                JOIN Event e ON e.eventID = s.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND s.isDeleted = false
                  AND ar.isDeleted = false
                GROUP BY e.eventName
                ORDER BY e.eventName ASC
                """, params, limit);
        return rows.stream().map(row -> new CountItem(stringOrDash(row[0]), toLong(row[1]))).toList();
    }

    public ScoreStats contributionScoreStats(Integer clubId, Integer semesterId) {
        Object[] row = singleRow("""
                SELECT AVG(COALESCE(mp.finalPoints, 0)),
                       MAX(COALESCE(mp.finalPoints, 0)),
                       MIN(COALESCE(mp.finalPoints, 0)),
                       SUM(COALESCE(mp.bonusPoints, 0)),
                       SUM(COALESCE(mp.penaltyPoints, 0)),
                       COUNT(DISTINCT mp.userID)
                FROM MemberPerformance mp
                JOIN Event e ON e.eventID = mp.eventID
                WHERE mp.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND mp.isDeleted = false
                  AND e.isDeleted = false
                """, params(clubId, semesterId));
        return new ScoreStats(
                toBigDecimal(row[0]),
                toBigDecimal(row[1]),
                toBigDecimal(row[2]),
                toLong(row[3]),
                toLong(row[4]),
                toLong(row[5])
        );
    }

    public long countContributionMembersByScore(Integer clubId, Integer semesterId, BigDecimal threshold, boolean passed) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("threshold", threshold.doubleValue());
        String operator = passed ? ">=" : "<";
        return rows("""
                SELECT mp.userID
                FROM MemberPerformance mp
                JOIN Event e ON e.eventID = mp.eventID
                WHERE mp.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND mp.isDeleted = false
                  AND e.isDeleted = false
                GROUP BY mp.userID
                HAVING AVG(COALESCE(mp.finalPoints, 0)) """ + operator + " :threshold", params).size();
    }

    public long countAppeals(Integer clubId, Integer semesterId) {
        return count("""
                SELECT COUNT(a)
                FROM ContributionAppeal a
                JOIN Event e ON e.eventID = a.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND a.isDeleted = false
                """, params(clubId, semesterId));
    }

    public long countPendingAppeals(Integer clubId, Integer semesterId) {
        Map<String, Object> params = params(clubId, semesterId);
        params.put("pending", com.fptu.fcms.enums.AppealStatus.PENDING);
        return count("""
                SELECT COUNT(a)
                FROM ContributionAppeal a
                JOIN Event e ON e.eventID = a.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND a.isDeleted = false
                  AND a.status = :pending
                """, params);
    }

    public List<CountItem> contributionScoreDistribution(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT CASE
                         WHEN COALESCE(mp.finalPoints, 0) >= 80 THEN '80-100'
                         WHEN COALESCE(mp.finalPoints, 0) >= 60 THEN '60-79'
                         WHEN COALESCE(mp.finalPoints, 0) >= 40 THEN '40-59'
                         ELSE '0-39'
                       END,
                       COUNT(mp)
                FROM MemberPerformance mp
                JOIN Event e ON e.eventID = mp.eventID
                WHERE mp.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND mp.isDeleted = false
                  AND e.isDeleted = false
                GROUP BY CASE
                         WHEN COALESCE(mp.finalPoints, 0) >= 80 THEN '80-100'
                         WHEN COALESCE(mp.finalPoints, 0) >= 60 THEN '60-79'
                         WHEN COALESCE(mp.finalPoints, 0) >= 40 THEN '40-59'
                         ELSE '0-39'
                       END
                """, params(clubId, semesterId));
        return rows.stream().map(row -> new CountItem(String.valueOf(row[0]), toLong(row[1]))).toList();
    }

    public List<AttentionRow> topContributors(Integer clubId, Integer semesterId, int limit) {
        List<Object[]> rows = rows("""
                SELECT u.userID, u.fullName, u.email, AVG(COALESCE(mp.finalPoints, 0))
                FROM MemberPerformance mp
                JOIN Event e ON e.eventID = mp.eventID
                JOIN UserAccount u ON u.userID = mp.userID
                WHERE mp.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND mp.isDeleted = false
                  AND e.isDeleted = false
                  AND u.isDeleted = false
                GROUP BY u.userID, u.fullName, u.email
                ORDER BY AVG(COALESCE(mp.finalPoints, 0)) DESC
                """, params(clubId, semesterId), limit);
        return rows.stream()
                .map(row -> new AttentionRow((Integer) row[0], stringOrDash(row[1]), stringOrDash(row[2]), toBigDecimal(row[3]), "TOP", "High contribution score"))
                .toList();
    }

    public Map<String, Long> countRecruitmentByStatus(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT COALESCE(r.status, 'UNKNOWN'), COUNT(r)
                FROM RecruitmentApplication r
                WHERE r.clubID = :clubId
                  AND r.semesterID = :semesterId
                  AND r.isDeleted = false
                GROUP BY r.status
                """, params(clubId, semesterId));
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(String.valueOf(row[0]), toLong(row[1]));
        }
        return result;
    }

    public long countBlacklist(Integer clubId) {
        return count("""
                SELECT COUNT(b)
                FROM ClubBlacklist b
                WHERE b.clubID = :clubId
                  AND b.isDeleted = false
                """, Map.of("clubId", clubId));
    }

    public List<MonthlyCount> eventMonthlyTrend(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT FUNCTION('YEAR', e.startDate), FUNCTION('MONTH', e.startDate), COUNT(e)
                FROM Event e
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND e.startDate IS NOT NULL
                GROUP BY FUNCTION('YEAR', e.startDate), FUNCTION('MONTH', e.startDate)
                ORDER BY FUNCTION('YEAR', e.startDate), FUNCTION('MONTH', e.startDate)
                """, params(clubId, semesterId));
        return rows.stream()
                .map(row -> new MonthlyCount(toInt(row[0]), toInt(row[1]), toLong(row[2])))
                .toList();
    }

    public List<MonthlyCount> memberMonthlyTrend(Integer clubId, Integer semesterId) {
        List<Object[]> rows = rows("""
                SELECT FUNCTION('YEAR', m.joinedDate), FUNCTION('MONTH', m.joinedDate), COUNT(m)
                FROM ClubMembership m
                WHERE m.clubID = :clubId
                  AND m.semesterID = :semesterId
                  AND m.isDeleted = false
                  AND m.joinedDate IS NOT NULL
                GROUP BY FUNCTION('YEAR', m.joinedDate), FUNCTION('MONTH', m.joinedDate)
                ORDER BY FUNCTION('YEAR', m.joinedDate), FUNCTION('MONTH', m.joinedDate)
                """, params(clubId, semesterId));
        return rows.stream()
                .map(row -> new MonthlyCount(toInt(row[0]), toInt(row[1]), toLong(row[2])))
                .toList();
    }

    public List<AttentionRow> findEventIssues(
            Integer clubId,
            Integer semesterId,
            LocalDateTime overdueCutoff,
            Collection<EventStatus> reportableStatuses,
            int limit
    ) {
        List<AttentionRow> result = new ArrayList<>();
        Map<String, Object> params = params(clubId, semesterId);
        params.put("cutoff", overdueCutoff);
        params.put("statuses", reportableStatuses);
        rows("""
                SELECT e.eventID, e.eventName, e.eventStatus, e.endDate
                FROM Event e
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND e.endDate < :cutoff
                  AND e.eventStatus IN :statuses
                  AND NOT EXISTS (
                    SELECT r.reportID FROM EventReport r
                    WHERE r.eventID = e.eventID AND r.isDeleted = false
                  )
                ORDER BY e.endDate ASC
                """, params, limit).forEach(row -> result.add(new AttentionRow(
                (Integer) row[0],
                stringOrDash(row[1]),
                row[2] == null ? "UNKNOWN" : String.valueOf(row[2]),
                BigDecimal.ZERO,
                "MISSING_REPORT",
                "Ended event has no report"
        )));

        if (result.size() >= limit) {
            return result;
        }

        params = params(clubId, semesterId);
        params.put("rejected", EventReportStatus.REJECTED);
        rows("""
                SELECT e.eventID, e.eventName, e.eventStatus, r.rejectionReason
                FROM Event e
                JOIN EventReport r ON r.eventID = e.eventID
                WHERE e.clubID = :clubId
                  AND e.semesterID = :semesterId
                  AND e.isDeleted = false
                  AND r.isDeleted = false
                  AND r.status = :rejected
                ORDER BY r.rejectedAt DESC
                """, params, limit - result.size()).forEach(row -> result.add(new AttentionRow(
                (Integer) row[0],
                stringOrDash(row[1]),
                row[2] == null ? "UNKNOWN" : String.valueOf(row[2]),
                BigDecimal.ZERO,
                "REPORT_REJECTED",
                stringOrDash(row[3])
        )));

        if (result.size() >= limit) {
            return result;
        }

        params = params(clubId, semesterId);
        params.put("finalized", ContributionBatchStatus.FINALIZED);
        rows("""
                SELECT e.eventID, e.eventName, e.eventStatus, b.status
                FROM ContributionBatch b
                JOIN Event e ON e.eventID = b.eventID
                WHERE b.clubID = :clubId
                  AND b.semesterID = :semesterId
                  AND b.isDeleted = false
                  AND e.isDeleted = false
                  AND b.status <> :finalized
                ORDER BY e.endDate ASC
                """, params, limit - result.size()).forEach(row -> result.add(new AttentionRow(
                (Integer) row[0],
                stringOrDash(row[1]),
                row[2] == null ? "UNKNOWN" : String.valueOf(row[2]),
                BigDecimal.ZERO,
                "CONTRIBUTION_NOT_FINALIZED",
                "Contribution batch status: " + String.valueOf(row[3])
        )));

        return result;
    }

    public List<AttentionRow> findReportIssues(Integer clubId, Integer semesterId, LocalDateTime overdueCutoff, Collection<EventStatus> reportableStatuses, int limit) {
        return findEventIssues(clubId, semesterId, overdueCutoff, reportableStatuses, limit).stream()
                .filter(row -> !"CONTRIBUTION_NOT_FINALIZED".equals(row.status()))
                .toList();
    }

    private Map<String, Object> params(Integer clubId, Integer semesterId) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("clubId", clubId);
        params.put("semesterId", semesterId);
        return params;
    }

    private long count(String jpql, Map<String, Object> params) {
        Number number = (Number) applyParams(entityManager.createQuery(jpql), params).getSingleResult();
        return toLong(number);
    }

    private long nativeCount(String sql, Map<String, Object> params) {
        return toLong(nativeNumber(sql, params));
    }

    private Number nativeNumber(String sql, Map<String, Object> params) {
        Object value = applyParams(entityManager.createNativeQuery(sql), params).getSingleResult();
        return value instanceof Number number ? number : null;
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> rows(String jpql, Map<String, Object> params) {
        return applyParams(entityManager.createQuery(jpql), params).getResultList();
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> rows(String jpql, Map<String, Object> params, int limit) {
        Query query = applyParams(entityManager.createQuery(jpql), params);
        if (limit > 0) {
            query.setMaxResults(limit);
        }
        return query.getResultList();
    }

    private Object[] singleRow(String jpql, Map<String, Object> params) {
        Object result = applyParams(entityManager.createQuery(jpql), params).getSingleResult();
        return (Object[]) result;
    }

    private Query applyParams(Query query, Map<String, Object> params) {
        params.forEach(query::setParameter);
        return query;
    }

    private long toLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private String stringOrDash(Object value) {
        if (value == null) {
            return "-";
        }
        String text = String.valueOf(value);
        return text.isBlank() ? "-" : text;
    }
}
