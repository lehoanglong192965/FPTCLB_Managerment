package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.MemberRankingDTO;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
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
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
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
import com.fptu.fcms.service.event.RegistrationLifecycle;
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
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberRankingServiceImpl implements MemberRankingService {

    private static final String ROLE_LEADER = "Leader";
    private static final String ROLE_VICE_LEADER = "ViceLeader";
    private static final String ROLE_MEMBER = "Member";
    private static final String BASE_POINTS_ATTENDEE_CONFIG = "BASE_POINTS_ATTENDEE";
    private static final int DEFAULT_EVENT_PARTICIPATION_POINT = 20;
    private static final Set<com.fptu.fcms.enums.EventStatus> RANKING_ELIGIBLE_EVENT_STATUSES = Set.of(
            com.fptu.fcms.enums.EventStatus.COMPLETED,
            com.fptu.fcms.enums.EventStatus.CLOSED,
            com.fptu.fcms.enums.EventStatus.CONTRIBUTION_CALCULATED
    );
    private static final int TIER_S_MIN_SCORE = 150;
    private static final int TIER_A_MIN_SCORE = 80;
    private static final int TIER_B_MIN_SCORE = 20;
    private static final String TIER_S = "S-Tier (Xuất sắc)";
    private static final String TIER_A = "A-Tier (Tích cực)";
    private static final String TIER_B = "B-Tier (Hoạt động tốt)";
    private static final String TIER_C = "C-Tier (Cảnh cáo)";
    private static final String TIER_S_DESCRIPTION = "Nhóm nòng cốt, gánh vác vị trí quan trọng hoặc đi hầu hết các event lớn.";
    private static final String TIER_A_DESCRIPTION = "Thành viên đại trà nhưng tích cực, làm tốt các công việc được giao ở mức tròn vai.";
    private static final String TIER_B_DESCRIPTION = "Thành viên có tham gia nhưng ngắt quãng, đóng góp ở mức tối thiểu để duy trì sự hiện diện.";
    private static final String TIER_C_DESCRIPTION = "Thành viên gần như biến mất, không check-in event, không nhận role hoặc bị trừ nhiều điểm.";

    private final ClubRepository clubRepository;
    private final ClubMembershipRepository membershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final SemesterRepository semesterRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
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
            List<Integer> snapshotUserIds = finalizedRanking.stream()
                    .map(MemberRankingSnapshot::getUserID)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
            Map<Integer, UserAccount> snapshotUsersById = userRepository.findAllByUserIDIn(snapshotUserIds)
                    .stream()
                    .collect(Collectors.toMap(UserAccount::getUserID, Function.identity()));
            Map<Integer, String> roleNamesByUserId = resolveClubRolesByUser(
                    clubId,
                    activeSemester.getSemesterID(),
                    snapshotUserIds
            );

            return finalizedRanking.stream()
                    .map(snapshot -> mapSnapshotToDTO(
                            snapshot,
                            club,
                            snapshotUsersById.get(snapshot.getUserID()),
                            roleNamesByUserId.get(snapshot.getUserID())
                    ))
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

        List<Integer> semesterEventIds = getRankingEligibleSemesterEventIds(clubId, activeSemester.getSemesterID());
        Map<Integer, String> roleNamesByUserId = resolveClubRolesByUser(clubId, activeSemester.getSemesterID(), userIds);
        Map<Integer, Integer> contributionPoints = calculateContributionPoints(clubId, semesterEventIds, userIds);
        Map<Integer, Integer> penaltyAdjustments = calculatePenaltyAdjustments(clubId, semesterEventIds, userIds);
        Map<Integer, Integer> participationPoints = calculateEventParticipationPoints(semesterEventIds, userIds);

        List<MemberRankingDTO> ranking = new ArrayList<>();
        for (Integer userId : userIds) {
            UserAccount user = usersById.get(userId);
            if (user == null) {
                continue;
            }

            int contributionPoint = contributionPoints.getOrDefault(userId, 0);
            int eventParticipationPoint = participationPoints.getOrDefault(userId, 0);
            int performancePoint = penaltyAdjustments.getOrDefault(userId, 0);
            int totalScore = contributionPoint + eventParticipationPoint + performancePoint;

            ranking.add(new MemberRankingDTO(
                    0,
                    user.getUserID(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getStudentId(),
                    roleNamesByUserId.getOrDefault(userId, ROLE_MEMBER),
                    resolveMemberTier(totalScore),
                    resolveMemberTierDescription(totalScore),
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

    private List<Integer> getRankingEligibleSemesterEventIds(Integer clubId, Integer semesterId) {
        return eventRepository.findByClubIDAndSemesterIDAndIsDeletedFalse(clubId, semesterId)
                .stream()
                .filter(this::isRankingEligibleEvent)
                .map(Event::getEventID)
                .toList();
    }

    private boolean isRankingEligibleEvent(Event event) {
        return event != null && RANKING_ELIGIBLE_EVENT_STATUSES.contains(event.getEventStatus());
    }
    private Map<Integer, String> resolveClubRolesByUser(Integer clubId, Integer semesterId, List<Integer> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }

        Set<Integer> targetUserIds = Set.copyOf(userIds);
        List<ClubMembership> memberships = membershipRepository
                .findByClubIDAndSemesterIDAndIsDeletedFalse(clubId, semesterId)
                .stream()
                .filter(membership -> targetUserIds.contains(membership.getUserID()))
                .toList();

        Set<Integer> roleIds = memberships.stream()
                .map(ClubMembership::getClubRoleID)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, String> roleNamesById = clubRoleRepository.findAllById(roleIds)
                .stream()
                .collect(Collectors.toMap(
                        ClubRole::getClubRoleID,
                        ClubRole::getRoleName,
                        (first, second) -> first
                ));

        return memberships.stream()
                .collect(Collectors.toMap(
                        ClubMembership::getUserID,
                        membership -> roleNamesById.getOrDefault(membership.getClubRoleID(), ROLE_MEMBER),
                        (first, second) -> first
                ));
    }

    /**
     * contributionPoint lấy từ bonusPoints trong MemberPerformance.
     * ContributionService đã đồng bộ điểm Contribution vào bonusPoints, nên không cộng thêm bảng Contribution để tránh double-count.
     */
    private Map<Integer, Integer> calculateContributionPoints(
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
                        Collectors.summingInt(performance -> performance.getBonusPoints() == null ? 0 : performance.getBonusPoints())
                ));
    }
    /**
     * performancePoint trong DTO là phần điều chỉnh điểm phạt âm: -penaltyPoints.
     */
    private Map<Integer, Integer> calculatePenaltyAdjustments(
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
                        Collectors.summingInt(this::resolvePenaltyAdjustment)
                ));
    }

    /**
     * eventParticipationPoint chỉ cộng khi member đã đăng ký và có AttendanceRecord Present.
     */
    private Map<Integer, Integer> calculateEventParticipationPoints(List<Integer> eventIds, List<Integer> userIds) {
        if (eventIds.isEmpty()) {
            return Map.of();
        }

        Map<Integer, Set<Integer>> registeredUsersByEvent = eventRegistrationRepository
                .findByEventIDInAndUserIDInAndRegistrationStatusAndIsDeletedFalse(
                        eventIds,
                        userIds,
                        RegistrationStatus.CONFIRMED
                )
                .stream()
                .filter(registration -> registration.getEventID() != null && registration.getUserID() != null)
                .collect(Collectors.groupingBy(
                        EventRegistration::getEventID,
                        Collectors.mapping(EventRegistration::getUserID, Collectors.toSet())
                ));

        int pointPerParticipation = resolveEventParticipationPoint();
        Map<Integer, Integer> result = new HashMap<>();
        for (Integer eventId : eventIds) {
            Set<Integer> registeredUsers = registeredUsersByEvent.getOrDefault(eventId, Set.of());
            if (registeredUsers.isEmpty()) {
                continue;
            }

            AttendanceSession session = attendanceSessionRepository.findByEventID(eventId).orElse(null);
            if (session == null) {
                continue;
            }

            attendanceRecordRepository.findBySessionID(session.getSessionID())
                    .stream()
                    .filter(record -> AttendanceStatus.PRESENT.equals(record.getAttendanceStatus()))
                    .map(AttendanceRecord::getUserID)
                    .filter(registeredUsers::contains)
                    .distinct()
                    .forEach(userId -> result.merge(userId, pointPerParticipation, Integer::sum));
        }
        return result;
    }
    private int resolvePenaltyAdjustment(MemberPerformance performance) {
        int penaltyPoints = performance.getPenaltyPoints() == null ? 0 : performance.getPenaltyPoints();
        return -penaltyPoints;
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


    private MemberRankingDTO mapSnapshotToDTO(
            MemberRankingSnapshot snapshot,
            Club club,
            UserAccount user,
            String clubRoleName
    ) {
        return new MemberRankingDTO(
                snapshot.getRank(),
                snapshot.getUserID(),
                snapshot.getFullName(),
                snapshot.getEmail(),
                user != null ? user.getStudentId() : null,
                clubRoleName != null ? clubRoleName : ROLE_MEMBER,
                resolveMemberTier(snapshot.getTotalScore()),
                resolveMemberTierDescription(snapshot.getTotalScore()),
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
                    item.getStudentId(),
                    item.getClubRoleName(),
                    resolveMemberTier(item.getTotalScore()),
                    resolveMemberTierDescription(item.getTotalScore()),
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

    private String resolveMemberTier(Integer totalScore) {
        int score = totalScore == null ? 0 : totalScore;
        if (score >= TIER_S_MIN_SCORE) {
            return TIER_S;
        }
        if (score >= TIER_A_MIN_SCORE) {
            return TIER_A;
        }
        if (score >= TIER_B_MIN_SCORE) {
            return TIER_B;
        }
        return TIER_C;
    }

    private String resolveMemberTierDescription(Integer totalScore) {
        int score = totalScore == null ? 0 : totalScore;
        if (score >= TIER_S_MIN_SCORE) {
            return TIER_S_DESCRIPTION;
        }
        if (score >= TIER_A_MIN_SCORE) {
            return TIER_A_DESCRIPTION;
        }
        if (score >= TIER_B_MIN_SCORE) {
            return TIER_B_DESCRIPTION;
        }
        return TIER_C_DESCRIPTION;
    }
}
