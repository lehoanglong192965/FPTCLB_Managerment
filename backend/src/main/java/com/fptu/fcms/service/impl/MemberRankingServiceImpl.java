package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.MemberPerformance;
import com.fptu.fcms.entity.MemberRankingSnapshot;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.SystemConfig;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.MemberPerformanceRepository;
import com.fptu.fcms.repository.MemberRankingSnapshotRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemConfigRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.MemberRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberRankingServiceImpl implements MemberRankingService {

    private static final String ROLE_LEADER = "Leader";
    private static final String ROLE_VICE_LEADER = "ViceLeader";
    private static final String ROLE_MEMBER = "Member";
    private static final String REGISTRATION_STATUS_REGISTERED = "REGISTERED";
    private static final String BASE_POINTS_ATTENDEE_CONFIG = "BASE_POINTS_ATTENDEE";
    private static final int DEFAULT_EVENT_PARTICIPATION_POINT = 20;

    private final ClubRepository clubRepository;
    private final ClubMembershipRepository membershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final SemesterRepository semesterRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final MemberPerformanceRepository memberPerformanceRepository;
    private final MemberRankingSnapshotRepository rankingSnapshotRepository;
    private final SystemConfigRepository systemConfigRepository;

    /**
     * Chặn người ngoài CLB xem BXH: chỉ Leader/ViceLeader/Member active của clubId hiện tại được xem.
     */
    @Override
    public void validateActiveClubMember(Integer clubId, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException("Bạn cần đăng nhập để xem bảng xếp hạng thành viên.", HttpStatus.FORBIDDEN);
        }

        clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new BusinessRuleException("CLB không tồn tại.", HttpStatus.NOT_FOUND));

        Semester activeSemester = getActiveSemester();

        List<Integer> allowedRoleIds = getAllowedMemberRoleIds();

        boolean isAllowedMember = membershipRepository
                .findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        clubId,
                        currentUser.getUserId(),
                        activeSemester.getSemesterID()
                )
                .map(ClubMembership::getClubRoleID)
                .filter(allowedRoleIds::contains)
                .isPresent();

        if (!isAllowedMember) {
            throw new BusinessRuleException(
                    "Chỉ thành viên active của CLB mới được xem bảng xếp hạng thành viên.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    /**
     * Cache kết quả BXH theo clubId; điểm được tự tính từ dữ liệu backend, không nhận từ request.
     */
    @Override
    @Cacheable(value = "memberRanking", key = "#clubId")
    public List<MemberRankingDTO> getMemberRankings(Integer clubId) {
        Club club = clubRepository.findByClubIDAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new BusinessRuleException("CLB không tồn tại.", HttpStatus.NOT_FOUND));

        Semester activeSemester = getActiveSemester();
        List<MemberRankingSnapshot> finalizedRanking = rankingSnapshotRepository
                .findBySemesterIDAndClubIDAndIsDeletedFalseOrderByRankAscUserIDAsc(
                        activeSemester.getSemesterID(),
                        clubId
                );
        if (!finalizedRanking.isEmpty()) {
            return finalizedRanking.stream()
                    .map(snapshot -> mapSnapshotToDTO(snapshot, club))
                    .toList();
        }
        List<Integer> allowedRoleIds = getAllowedMemberRoleIds();
        List<ClubMembership> memberships = membershipRepository
                .findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
                        clubId,
                        activeSemester.getSemesterID(),
                        allowedRoleIds
                );

        if (memberships.isEmpty()) {
            return List.of();
        }

        List<Integer> userIds = memberships.stream()
                .map(ClubMembership::getUserID)
                .distinct()
                .toList();

        Map<Integer, UserAccount> usersById = userRepository.findAllByUserIDIn(userIds)
                .stream()
                .collect(Collectors.toMap(UserAccount::getUserID, Function.identity()));

        List<Integer> semesterEventIds = getSemesterEventIds(clubId, activeSemester.getSemesterID());
        Map<Integer, Integer> performancePoints = calculatePerformancePoints(clubId, semesterEventIds, userIds);
        Map<Integer, Integer> participationPoints = calculateEventParticipationPoints(semesterEventIds, userIds);

        List<MemberRankingDTO> ranking = new ArrayList<>();
        for (Integer userId : userIds) {
            UserAccount user = usersById.get(userId);
            if (user == null) {
                continue;
            }

            int contributionPoint = 0;
            int eventParticipationPoint = participationPoints.getOrDefault(userId, 0);
            int performancePoint = performancePoints.getOrDefault(userId, 0);
            int totalScore = contributionPoint + eventParticipationPoint + performancePoint;

            ranking.add(new MemberRankingDTO(
                    0,
                    user.getUserID(),
                    user.getFullName(),
                    user.getEmail(),
                    club.getClubID(),
                    club.getClubName(),
                    totalScore,
                    contributionPoint,
                    eventParticipationPoint,
                    performancePoint
            ));
        }

        ranking.sort(Comparator
                .comparing(MemberRankingDTO::getTotalScore).reversed()
                .thenComparing(MemberRankingDTO::getFullName, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(MemberRankingDTO::getUserId));

        return assignRanks(ranking);
    }

    private Semester getActiveSemester() {
        return semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy học kỳ đang hoạt động."));
    }

    private List<Integer> getAllowedMemberRoleIds() {
        return List.of(ROLE_LEADER, ROLE_VICE_LEADER, ROLE_MEMBER)
                .stream()
                .map(roleName -> clubRoleRepository.findByRoleNameAndIsDeletedFalse(roleName))
                .flatMap(Optional::stream)
                .map(ClubRole::getClubRoleID)
                .toList();
    }

    private List<Integer> getSemesterEventIds(Integer clubId, Integer semesterId) {
        return eventRepository.findByClubIDAndSemesterIDAndIsDeletedFalse(clubId, semesterId)
                .stream()
                .map(Event::getEventID)
                .toList();
    }
    /**
     * performancePoint lấy từ MemberPerformance.finalPoints của các thành viên active trong CLB.
     */
    private Map<Integer, Integer> calculatePerformancePoints(
            Integer clubId,
            List<Integer> semesterEventIds,
            List<Integer> userIds
    ) {
        if (semesterEventIds.isEmpty()) {
            return Map.of();
        }

        return memberPerformanceRepository
                .findByClubIDAndEventIDInAndUserIDInAndIsDeletedFalse(clubId, semesterEventIds, userIds)
                .stream()
                .collect(Collectors.groupingBy(
                        MemberPerformance::getUserID,
                        Collectors.summingInt(this::resolveFinalPoints)
                ));
    }

    /**
     * eventParticipationPoint tính từ EventRegistration Registered của event thuộc CLB.
     */
    private Map<Integer, Integer> calculateEventParticipationPoints(List<Integer> eventIds, List<Integer> userIds) {
        if (eventIds.isEmpty()) {
            return Map.of();
        }

        int pointPerParticipation = resolveEventParticipationPoint();
        Map<Integer, Long> participationCount = eventRegistrationRepository
                .findByEventIDInAndUserIDInAndStatusAndIsDeletedFalse(
                        eventIds,
                        userIds,
                        REGISTRATION_STATUS_REGISTERED
                )
                .stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(EventRegistration::getUserID, Collectors.counting()));

        Map<Integer, Integer> result = new HashMap<>();
        participationCount.forEach((userId, count) -> result.put(userId, Math.toIntExact(count * pointPerParticipation)));
        return result;
    }

    private int resolveFinalPoints(MemberPerformance performance) {
        if (performance.getFinalPoints() != null) {
            return performance.getFinalPoints();
        }
        int basePoints = performance.getBasePoints() == null ? 0 : performance.getBasePoints();
        int bonusPoints = performance.getBonusPoints() == null ? 0 : performance.getBonusPoints();
        int penaltyPoints = performance.getPenaltyPoints() == null ? 0 : performance.getPenaltyPoints();
        return basePoints + bonusPoints - penaltyPoints;
    }

    private int resolveEventParticipationPoint() {
        return systemConfigRepository.findByConfigKey(BASE_POINTS_ATTENDEE_CONFIG)
                .map(SystemConfig::getConfigValue)
                .flatMap(this::parsePositiveInt)
                .orElse(DEFAULT_EVENT_PARTICIPATION_POINT);
    }

    private Optional<Integer> parsePositiveInt(String rawValue) {
        try {
            int value = Integer.parseInt(rawValue);
            return value > 0 ? Optional.of(value) : Optional.empty();
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }


    private MemberRankingDTO mapSnapshotToDTO(MemberRankingSnapshot snapshot, Club club) {
        return new MemberRankingDTO(
                snapshot.getRank(),
                snapshot.getUserID(),
                snapshot.getFullName(),
                snapshot.getEmail(),
                club.getClubID(),
                club.getClubName(),
                snapshot.getTotalScore(),
                snapshot.getContributionPoint(),
                snapshot.getEventParticipationPoint(),
                snapshot.getPerformancePoint()
        );
    }
    /**
     * Thành viên cùng totalScore nhận cùng rank; rank tiếp theo giữ đúng vị trí thực tế.
     */
    private List<MemberRankingDTO> assignRanks(List<MemberRankingDTO> sortedRanking) {
        List<MemberRankingDTO> ranked = new ArrayList<>();
        int rank = 0;
        Integer previousScore = null;

        for (int index = 0; index < sortedRanking.size(); index++) {
            MemberRankingDTO item = sortedRanking.get(index);
            if (!Objects.equals(previousScore, item.getTotalScore())) {
                rank = index + 1;
                previousScore = item.getTotalScore();
            }

            ranked.add(new MemberRankingDTO(
                    rank,
                    item.getUserId(),
                    item.getFullName(),
                    item.getEmail(),
                    item.getClubId(),
                    item.getClubName(),
                    item.getTotalScore(),
                    item.getContributionPoint(),
                    item.getEventParticipationPoint(),
                    item.getPerformancePoint()
            ));
        }
        return ranked;
    }
}
