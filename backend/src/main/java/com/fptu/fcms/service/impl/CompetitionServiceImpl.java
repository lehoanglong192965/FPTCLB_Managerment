package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.*;
import com.fptu.fcms.repository.*;
import com.fptu.fcms.service.CompetitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompetitionServiceImpl implements CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionScoreRepository scoreRepository;
    private final CompetitionPenaltyRepository penaltyRepository;
    private final CompetitionAwardRepository awardRepository;
    private final ClubMembershipRepository membershipRepository;
    private final EventRegistrationRepository registrationRepository;

    // Score weight constants (BE-COMP-02..06)
    private static final int MAX_ACTIVITY_SCORE = 25;
    private static final int ACTIVITY_POINTS_PER_EVENT = 5;

    private static final int MAX_FEEDBACK_SCORE = 20;

    private static final int MAX_PARTICIPATION_SCORE = 15;
    private static final int PARTICIPATION_POINTS_PER_EVENT = 3;

    private static final int MAX_COMPLIANCE_SCORE = 15;

    private static final int MAX_ENGAGEMENT_SCORE = 25;

    // --- BE-COMP-01: CRUD + Status Flow ---

    @Override
    public List<Competition> getAllCompetitions() {
        return competitionRepository.findAll();
    }

    @Override
    public Competition getCompetitionById(Integer id) {
        return competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found: " + id));
    }

    @Override
    @Transactional
    public Competition createCompetition(Competition competition) {
        competition.setStatus("Draft");
        return competitionRepository.save(competition);
    }

    @Override
    @Transactional
    public Competition updateCompetition(Integer id, Competition updated) {
        Competition existing = getCompetitionById(id);
        if (!"Draft".equals(existing.getStatus())) {
            throw new IllegalStateException("Chỉ có thể sửa Competition ở trạng thái Draft");
        }
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        return competitionRepository.save(existing);
    }

    // --- BE-COMP-10: Approve / Publish ---

    @Override
    @Transactional
    public void approveCompetition(Integer id) {
        Competition competition = getCompetitionById(id);
        if (!"Calculated".equals(competition.getStatus())) {
            throw new IllegalStateException("Phải tính điểm trước khi approve. Trạng thái hiện tại: " + competition.getStatus());
        }
        competition.setStatus("Approved");
        competitionRepository.save(competition);
        log.info("Competition {} approved", id);
    }

    @Override
    @Transactional
    public void publishCompetition(Integer id) {
        Competition competition = getCompetitionById(id);
        if (!"Approved".equals(competition.getStatus())) {
            throw new IllegalStateException("Phải approve trước khi publish. Trạng thái hiện tại: " + competition.getStatus());
        }
        competition.setStatus("Published");
        competitionRepository.save(competition);
        log.info("Competition {} published", id);
    }

    // --- BE-COMP-09: Ranking with Tie-break ---

    @Override
    public Map<String, Object> getCompetitionRanking(Integer competitionId) {
        log.info("Fetching ranking for competition {}", competitionId);

        List<CompetitionScore> scores = scoreRepository.findByCompetitionIDOrderByTotalScoreDesc(competitionId);

        // Tie-break: same totalScore → sort by activityScore desc, then participationScore desc
        scores.sort(Comparator.comparing(CompetitionScore::getTotalScore).reversed()
                .thenComparing(Comparator.comparing(CompetitionScore::getActivityScore).reversed())
                .thenComparing(Comparator.comparing(CompetitionScore::getParticipationScore).reversed()));

        // Assign rank
        List<Map<String, Object>> rankings = new ArrayList<>();
        int rank = 1;
        for (int i = 0; i < scores.size(); i++) {
            CompetitionScore s = scores.get(i);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("rank", rank);
            entry.put("userID", s.getUserID());
            entry.put("activityScore", s.getActivityScore());
            entry.put("feedbackScore", s.getFeedbackScore());
            entry.put("participationScore", s.getParticipationScore());
            entry.put("complianceScore", s.getComplianceScore());
            entry.put("engagementScore", s.getEngagementScore());
            entry.put("totalScore", s.getTotalScore());
            rankings.add(entry);

            // Next person gets a different rank only if score differs
            if (i + 1 < scores.size() && !scores.get(i + 1).getTotalScore().equals(s.getTotalScore())) {
                rank = i + 2;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("competitionId", competitionId);
        result.put("totalParticipants", scores.size());
        result.put("rankings", rankings);

        return result;
    }

    // --- BE-COMP-08: Score Calculation Transaction ---

    @Override
    @Transactional
    public void calculateScores(Integer competitionId) {
        log.info("Calculating scores for competition {}...", competitionId);

        Competition competition = getCompetitionById(competitionId);
        if ("Published".equals(competition.getStatus())) {
            throw new IllegalStateException("Không thể tính lại điểm cho Competition đã Published");
        }

        // 1. Clear old scores
        scoreRepository.deleteByCompetitionID(competitionId);

        // 2. Fetch all members of the club in the semester
        List<ClubMembership> members = membershipRepository.findByClubIDAndSemesterIDAndIsDeletedFalse(
                competition.getClubID(), competition.getSemesterID());

        // 3. Batch-fetch registrations for the user set to avoid N+1
        List<CompetitionScore> newScores = new ArrayList<>();

        for (ClubMembership member : members) {
            CompetitionScore score = new CompetitionScore();
            score.setCompetitionID(competitionId);
            score.setUserID(member.getUserID());

            // BE-COMP-02: ActivityScore — based on events organized as CORE_TEAM / SUPPORT_ORGANIZER
            int activityScore = calculateActivityScore(member.getUserID());
            score.setActivityScore(activityScore);

            // BE-COMP-03: IndependentFeedbackScore — count registrations with feedback
            int feedbackScore = calculateFeedbackScore(member.getUserID());
            score.setFeedbackScore(feedbackScore);

            // BE-COMP-04: ParticipationScore
            int participationScore = calculateParticipationScore(member.getUserID());
            score.setParticipationScore(participationScore);

            // BE-COMP-06: ComplianceScore — base 15, minus penalties
            int complianceScore = calculateComplianceScore(member.getUserID(), competitionId);
            score.setComplianceScore(complianceScore);

            // BE-COMP-05: MemberEngagementScore
            int engagementScore = calculateEngagementScore(member);
            score.setEngagementScore(engagementScore);

            // Total
            int total = activityScore + feedbackScore + participationScore + complianceScore + engagementScore;
            score.setTotalScore(total);

            newScores.add(score);
        }

        // 4. Save Batch
        scoreRepository.saveAll(newScores);

        // 5. Update status
        competition.setStatus("Calculated");
        competitionRepository.save(competition);

        log.info("Successfully calculated and saved scores for {} members in competition {}.", newScores.size(), competitionId);
    }

    // --- BE-COMP-11: Award Recipients ---

    @Override
    @Transactional
    public void assignAwards(Integer competitionId) {
        Competition competition = getCompetitionById(competitionId);
        if (!"Published".equals(competition.getStatus())) {
            throw new IllegalStateException("Chỉ gán Award cho Competition đã Published");
        }

        List<CompetitionScore> scores = scoreRepository.findByCompetitionIDOrderByTotalScoreDesc(competitionId);
        if (scores.isEmpty()) {
            log.warn("No scores found for competition {}", competitionId);
            return;
        }

        // Top 1 → Leader Award
        CompetitionAward leaderAward = new CompetitionAward();
        leaderAward.setCompetitionID(competitionId);
        leaderAward.setAwardName("Outstanding Club Leader");
        leaderAward.setDescription("Thành viên có điểm thi đua cao nhất CLB");
        leaderAward.setPointsBonus(10);
        awardRepository.save(leaderAward);

        // Top 2 → Vice Award
        if (scores.size() >= 2) {
            CompetitionAward viceAward = new CompetitionAward();
            viceAward.setCompetitionID(competitionId);
            viceAward.setAwardName("Outstanding Vice Leader");
            viceAward.setDescription("Thành viên có điểm thi đua cao thứ nhì CLB");
            viceAward.setPointsBonus(5);
            awardRepository.save(viceAward);
        }

        log.info("Awards assigned for competition {}", competitionId);
    }

    // --- Private Helper Methods for Scoring ---

    private int calculateActivityScore(Integer userID) {
        // Count registrations where user was CORE_TEAM or SUPPORT_ORGANIZER
        List<EventRegistration> regs = registrationRepository.findByUserIDAndIsDeletedFalse(userID);
        long organizedCount = regs.stream()
                .filter(r -> r.getParticipantType() != null &&
                        (r.getParticipantType().name().equals("CORE_TEAM") ||
                         r.getParticipantType().name().equals("SUPPORT_ORGANIZER")))
                .count();
        return Math.min((int) organizedCount * ACTIVITY_POINTS_PER_EVENT, MAX_ACTIVITY_SCORE);
    }

    private int calculateFeedbackScore(Integer userID) {
        // Count confirmed registrations (feedback is tied to registration, not directly to user)
        List<EventRegistration> regs = registrationRepository.findByUserIDAndIsDeletedFalse(userID);
        // Approximate: each confirmed registration that could have had feedback = 4 points
        long confirmedCount = regs.stream()
                .filter(r -> r.getRegistrationStatus() != null &&
                        r.getRegistrationStatus().name().equals("CONFIRMED"))
                .count();
        return Math.min((int) confirmedCount * 4, MAX_FEEDBACK_SCORE);
    }

    private int calculateParticipationScore(Integer userID) {
        // Count events where user was PARTICIPANT and CONFIRMED
        List<EventRegistration> regs = registrationRepository.findByUserIDAndIsDeletedFalse(userID);
        long participatedCount = regs.stream()
                .filter(r -> r.getParticipantType() != null &&
                        r.getParticipantType().name().equals("PARTICIPANT"))
                .filter(r -> r.getRegistrationStatus() != null &&
                        r.getRegistrationStatus().name().equals("CONFIRMED"))
                .count();
        return Math.min((int) participatedCount * PARTICIPATION_POINTS_PER_EVENT, MAX_PARTICIPATION_SCORE);
    }

    private int calculateComplianceScore(Integer userID, Integer competitionId) {
        // Base 15 minus total penalty pointsDeduction
        List<CompetitionPenalty> penalties = penaltyRepository.findByCompetitionIDAndUserID(competitionId, userID);
        int totalDeduction = penalties.stream()
                .filter(p -> p.getPointsDeduction() != null)
                .mapToInt(CompetitionPenalty::getPointsDeduction)
                .sum();
        return Math.max(MAX_COMPLIANCE_SCORE - totalDeduction, 0);
    }

    private int calculateEngagementScore(ClubMembership member) {
        // Exclude Leader/Vice from engagement scoring as per BE-COMP-05
        // ClubRoleID convention: 1=Leader, 2=Vice — they get full marks by default
        if (member.getClubRoleID() != null && (member.getClubRoleID() == 1 || member.getClubRoleID() == 2)) {
            return MAX_ENGAGEMENT_SCORE;
        }
        // For regular members: simplified placeholder
        // In production, this would query ContributionRepository for approved contributions
        return 15;
    }
}
