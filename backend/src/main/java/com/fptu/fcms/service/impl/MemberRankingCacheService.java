package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.SystemConfig;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.MemberPerformanceRepository;
import com.fptu.fcms.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MemberRankingCacheService {

    private static final String BASE_POINTS_ATTENDEE = "BASE_POINTS_ATTENDEE";
    private static final int DEFAULT_ATTENDEE_POINT = 20;

    private final ClubRepository clubRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final MemberPerformanceRepository memberPerformanceRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final SystemConfigRepository systemConfigRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "memberRanking", key = "#clubId")
    public List<MemberRankingDTO> getCachedMemberRankings(Integer clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy CLB.",
                        HttpStatus.NOT_FOUND
                ));

        Map<Integer, ScoreBucket> scores = new HashMap<>();
        collectPerformanceScores(clubId, scores);
        collectParticipationScores(clubId, scores);

        List<MemberRankingDTO> rankings = clubMembershipRepository.findActiveUsersByClubID(clubId).stream()
                .map(user -> toRankingDTO(user, club, scores.getOrDefault(user.getUserID(), new ScoreBucket())))
                .sorted(Comparator.comparing(MemberRankingDTO::getTotalScore).reversed()
                        .thenComparing(MemberRankingDTO::getFullName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }

        return rankings;
    }

    private void collectPerformanceScores(Integer clubId, Map<Integer, ScoreBucket> scores) {
        for (Object[] row : memberPerformanceRepository.summarizeMemberPointsByClubID(clubId)) {
            Integer userID = (Integer) row[0];
            ScoreBucket bucket = scores.computeIfAbsent(userID, key -> new ScoreBucket());
            bucket.performancePoint = toInt(row[1]);
            bucket.contributionPoint = toInt(row[2]);
        }
    }

    private void collectParticipationScores(Integer clubId, Map<Integer, ScoreBucket> scores) {
        int attendeePoint = getAttendeePoint();
        for (Object[] row : eventRegistrationRepository.countRegisteredParticipationByClubID(clubId)) {
            Integer userID = (Integer) row[0];
            ScoreBucket bucket = scores.computeIfAbsent(userID, key -> new ScoreBucket());
            bucket.eventParticipationPoint = toInt(row[1]) * attendeePoint;
        }
    }

    private int getAttendeePoint() {
        return systemConfigRepository.findByConfigKey(BASE_POINTS_ATTENDEE)
                .map(SystemConfig::getConfigValue)
                .map(this::parsePositiveInt)
                .orElse(DEFAULT_ATTENDEE_POINT);
    }

    private int parsePositiveInt(String value) {
        try {
            int parsed = Integer.parseInt(value);
            return parsed >= 0 ? parsed : DEFAULT_ATTENDEE_POINT;
        } catch (NumberFormatException ex) {
            return DEFAULT_ATTENDEE_POINT;
        }
    }

    private MemberRankingDTO toRankingDTO(UserAccount user, Club club, ScoreBucket score) {
        int totalScore = score.contributionPoint + score.eventParticipationPoint + score.performancePoint;
        return new MemberRankingDTO(
                null,
                user.getUserID(),
                user.getFullName(),
                user.getEmail(),
                club.getClubID(),
                club.getClubName(),
                totalScore,
                score.contributionPoint,
                score.eventParticipationPoint,
                score.performancePoint
        );
    }

    private int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private static class ScoreBucket {
        private int contributionPoint;
        private int eventParticipationPoint;
        private int performancePoint;
    }
}
