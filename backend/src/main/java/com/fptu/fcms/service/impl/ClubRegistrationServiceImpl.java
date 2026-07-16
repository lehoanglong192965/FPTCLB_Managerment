package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.FoundingMemberDTO;
import com.fptu.fcms.dto.request.ReviewRegistrationRequestDTO;
import com.fptu.fcms.dto.response.ClubRegistrationResponseDTO;
import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRegistration;
import com.fptu.fcms.entity.ClubRegistrationMember;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRegistrationRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.ClubRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClubRegistrationServiceImpl implements ClubRegistrationService {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String ROLE_LEADER = "Leader";
    private static final String ROLE_VICE_LEADER = "ViceLeader";
    private static final String ROLE_MEMBER = "Member";
    private static final String SYSTEM_ROLE_STUDENT = "Student";
    private static final String DISCIPLINE_ACTIVE = "Active";
    private static final Set<String> ALLOWED_REGISTRATION_STATUSES =
            Set.of(STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED);
    private static final Set<String> ALLOWED_CLUB_ROLES =
            Set.of(ROLE_LEADER, ROLE_VICE_LEADER, ROLE_MEMBER);

    private final ClubRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final SemesterRepository semesterRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final DisciplineLogRepository disciplineLogRepository;

    @Override
    @Transactional
    public ClubRegistrationResponseDTO submitRegistration(ClubRegistrationRequestDTO request, Integer currentUserId) {
        Semester activeSemester = loadActiveSemester();
        Map<String, ClubRole> clubRoles = loadRequiredClubRoles();
        validateClubUnique(request.getClubCode(), request.getClubName());
        FoundingMemberValidation validation = validateFoundingMembers(
                fromRequestMembers(request.getFoundingMembers()),
                activeSemester,
                clubRoles
        );

        ClubRegistration registration = buildRegistration(request, currentUserId, STATUS_APPROVED);
        registration.setFoundingMembers(buildRegistrationMembers(registration, request.getFoundingMembers()));

        ClubRegistration savedRegistration = registrationRepository.save(registration);
        Club club = createActiveClub(savedRegistration);
        createFoundingMemberships(validation, club, activeSemester, clubRoles);

        return mapToResponse(savedRegistration);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClubRegistrationResponseDTO> getMyRegistrations(Integer currentUserId) {
        return registrationRepository.findByCreatedByAndIsDeletedFalse(currentUserId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClubRegistrationResponseDTO> getRegistrations(String status) {
        String normalizedStatus = normalizeStatus(status);
        List<ClubRegistration> registrations = normalizedStatus == null
                ? registrationRepository.findByIsDeletedFalse()
                : registrationRepository.findByStatusAndIsDeletedFalse(normalizedStatus);

        return registrations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClubRegistrationResponseDTO> getPendingRegistrations() {
        return getRegistrations(STATUS_PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public ClubRegistrationResponseDTO getRegistrationById(Integer id) {
        ClubRegistration registration = registrationRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new BusinessRuleException("Club registration not found.", HttpStatus.NOT_FOUND));
        return mapToResponse(registration);
    }

    @Override
    @Transactional
    public ClubRegistrationResponseDTO reviewRegistration(Integer id, ReviewRegistrationRequestDTO request, Integer reviewerId) {
        ClubRegistration registration = registrationRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new BusinessRuleException("Club registration not found.", HttpStatus.NOT_FOUND));

        if (!STATUS_PENDING.equals(registration.getStatus())) {
            throw new BusinessRuleException("This registration has already been reviewed.", HttpStatus.CONFLICT);
        }

        if (STATUS_APPROVED.equals(request.getStatus())) {
            Semester activeSemester = loadActiveSemester();
            Map<String, ClubRole> clubRoles = loadRequiredClubRoles();
            validateClubUnique(registration.getClubCode(), registration.getClubName());
            FoundingMemberValidation validation = validateFoundingMembers(
                    fromRegistrationMembers(registration.getFoundingMembers()),
                    activeSemester,
                    clubRoles
            );

            Club club = createActiveClub(registration);
            createFoundingMemberships(validation, club, activeSemester, clubRoles);
            registration.setStatus(STATUS_APPROVED);
        } else if (STATUS_REJECTED.equals(request.getStatus())) {
            registration.setStatus(STATUS_REJECTED);
        } else {
            throw new BusinessRuleException("Review status must be APPROVED or REJECTED.", HttpStatus.BAD_REQUEST);
        }

        registration.setIcpdpComment(request.getIcpdpComment());
        registration.setUpdatedAt(LocalDateTime.now());
        ClubRegistration saved = registrationRepository.save(registration);

        return mapToResponse(saved);
    }

    private Semester loadActiveSemester() {
        return semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("No active semester is configured.", HttpStatus.CONFLICT));
    }

    private void validateClubUnique(String clubCode, String clubName) {
        if (clubRepository.existsByClubCodeAndIsDeletedFalse(clubCode)) {
            throw new BusinessRuleException("Club code already exists.", HttpStatus.CONFLICT);
        }
        if (clubRepository.existsByClubNameAndIsDeletedFalse(clubName)) {
            throw new BusinessRuleException("Club name already exists.", HttpStatus.CONFLICT);
        }
    }

    private Map<String, ClubRole> loadRequiredClubRoles() {
        Map<String, ClubRole> roles = new HashMap<>();
        roles.put(ROLE_LEADER, findClubRole(ROLE_LEADER));
        roles.put(ROLE_VICE_LEADER, findClubRole(ROLE_VICE_LEADER));
        roles.put(ROLE_MEMBER, findClubRole(ROLE_MEMBER));
        return roles;
    }

    private ClubRole findClubRole(String roleName) {
        return clubRoleRepository.findByRoleNameAndIsDeletedFalse(roleName)
                .orElseThrow(() -> new BusinessRuleException(
                        "Club role is not configured: " + roleName,
                        HttpStatus.INTERNAL_SERVER_ERROR
                ));
    }

    private FoundingMemberValidation validateFoundingMembers(
            List<FounderCandidate> candidates,
            Semester activeSemester,
            Map<String, ClubRole> clubRoles
    ) {
        if (candidates.size() < 5) {
            throw new BusinessRuleException("Founding team must include at least 5 students.");
        }

        for (FounderCandidate candidate : candidates) {
            if (!ALLOWED_CLUB_ROLES.contains(candidate.proposedRole())) {
                throw new BusinessRuleException("Founding member role must be Leader, ViceLeader, or Member.");
            }
        }

        long leaderCount = candidates.stream().filter(candidate -> ROLE_LEADER.equals(candidate.proposedRole())).count();
        long viceLeaderCount = candidates.stream().filter(candidate -> ROLE_VICE_LEADER.equals(candidate.proposedRole())).count();
        long memberCount = candidates.stream().filter(candidate -> ROLE_MEMBER.equals(candidate.proposedRole())).count();

        if (leaderCount != 1 || viceLeaderCount != 1 || memberCount < 3) {
            throw new BusinessRuleException("Founding team must include exactly 1 Leader, exactly 1 ViceLeader, and at least 3 Members.");
        }

        SystemRole studentRole = systemRoleRepository.findByRoleName(SYSTEM_ROLE_STUDENT)
                .orElseThrow(() -> new BusinessRuleException(
                        "Student system role is not configured.",
                        HttpStatus.INTERNAL_SERVER_ERROR
                ));

        Integer leaderRoleId = clubRoles.get(ROLE_LEADER).getClubRoleID();
        Set<String> seenStudentIds = new HashSet<>();
        Map<String, UserAccount> usersByStudentId = new HashMap<>();

        for (FounderCandidate candidate : candidates) {
            if (!seenStudentIds.add(candidate.studentId())) {
                throw new BusinessRuleException("Duplicate founding member student ID: " + candidate.studentId());
            }

            UserAccount user = userRepository.findByStudentIdAndIsDeletedFalse(candidate.studentId())
                    .orElseThrow(() -> new BusinessRuleException(
                            "Student account does not exist for student ID: " + candidate.studentId()
                    ));

            if (!studentRole.getRoleID().equals(user.getRoleID())) {
                throw new BusinessRuleException("Founding members must be student accounts.");
            }

            int activeClubCount = clubMembershipRepository.countByUserIDAndSemesterIDAndIsDeletedFalse(
                    user.getUserID(),
                    activeSemester.getSemesterID()
            );
            if (activeClubCount >= 4) {
                throw new BusinessRuleException("Student has already reached the 4-club limit: " + candidate.studentId());
            }

            if (ROLE_LEADER.equals(candidate.proposedRole())) {
                validateLeaderEligibility(user, activeSemester, leaderRoleId);
            }

            usersByStudentId.put(candidate.studentId(), user);
        }

        return new FoundingMemberValidation(candidates, usersByStudentId);
    }

    private void validateLeaderEligibility(UserAccount leader, Semester activeSemester, Integer leaderRoleId) {
        boolean hasActiveDiscipline = disciplineLogRepository.hasActiveDiscipline(
                leader.getUserID(),
                activeSemester.getSemesterID(),
                DISCIPLINE_ACTIVE
        );
        if (hasActiveDiscipline) {
            throw new BusinessRuleException("Proposed Leader has an active discipline record.");
        }

        boolean alreadyLeader = clubMembershipRepository.existsByUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                leader.getUserID(),
                activeSemester.getSemesterID(),
                leaderRoleId
        );
        if (alreadyLeader) {
            throw new BusinessRuleException("Proposed Leader already leads another club in this semester.");
        }
    }

    private ClubRegistration buildRegistration(
            ClubRegistrationRequestDTO request,
            Integer currentUserId,
            String status
    ) {
        LocalDateTime now = LocalDateTime.now();
        return ClubRegistration.builder()
                .clubCode(request.getClubCode())
                .clubName(request.getClubName())
                .clubNameEn(request.getClubNameEn())
                .category(request.getCategory())
                .clubImage(request.getClubImage())
                .clubImagePublicId(request.getClubImagePublicId())
                .description(request.getDescription())
                .mission(request.getMission())
                .uniqueness(request.getUniqueness())
                .orgStructure(request.getOrgStructure())
                .meetingFrequency(request.getMeetingFrequency())
                .meetingLocation(request.getMeetingLocation())
                .financialPlan(request.getFinancialPlan())
                .status(status)
                .createdBy(currentUserId)
                .createdAt(now)
                .updatedAt(STATUS_APPROVED.equals(status) ? now : null)
                .isDeleted(false)
                .build();
    }

    private List<ClubRegistrationMember> buildRegistrationMembers(
            ClubRegistration registration,
            List<FoundingMemberDTO> foundingMembers
    ) {
        return foundingMembers.stream()
                .map(member -> ClubRegistrationMember.builder()
                        .registration(registration)
                        .studentId(normalizeStudentId(member.getStudentId()))
                        .proposedRole(normalizeRole(member.getProposedRole()))
                        .fullName(member.getFullName())
                        .email(member.getEmail())
                        .phoneNumber(member.getPhoneNumber())
                        .cohort(member.getCohort())
                        .clazz(member.getClazz())
                        .facebookLink(member.getFacebookLink())
                        .cardImage(member.getCardImage())
                        .cardImagePublicId(member.getCardImagePublicId())
                        .isDeleted(false)
                        .build()
                )
                .collect(Collectors.toList());
    }

    private Club createActiveClub(ClubRegistration registration) {
        Club club = new Club();
        club.setClubCode(registration.getClubCode());
        club.setClubName(registration.getClubName());
        club.setDescription(registration.getDescription());
        club.setCategory(registration.getCategory());
        club.setClubImage(registration.getClubImage());
        club.setClubImagePublicId(registration.getClubImagePublicId());
        club.setClubStatus("Active");
        club.setCreatedAt(LocalDateTime.now());
        club.setIsDeleted(false);
        return clubRepository.save(club);
    }

    private void createFoundingMemberships(
            FoundingMemberValidation validation,
            Club club,
            Semester activeSemester,
            Map<String, ClubRole> clubRoles
    ) {
        for (FounderCandidate candidate : validation.candidates()) {
            UserAccount user = validation.usersByStudentId().get(candidate.studentId());
            ClubMembership membership = new ClubMembership();
            membership.setClubID(club.getClubID());
            membership.setUserID(user.getUserID());
            membership.setSemesterID(activeSemester.getSemesterID());
            membership.setClubRoleID(clubRoles.get(candidate.proposedRole()).getClubRoleID());
            membership.setJoinedDate(LocalDate.now());
            membership.setIsDeleted(false);
            clubMembershipRepository.save(membership);
        }
    }

    private List<FounderCandidate> fromRequestMembers(List<FoundingMemberDTO> members) {
        return members.stream()
                .map(member -> new FounderCandidate(
                        normalizeStudentId(member.getStudentId()),
                        normalizeRole(member.getProposedRole())
                ))
                .collect(Collectors.toList());
    }

    private List<FounderCandidate> fromRegistrationMembers(List<ClubRegistrationMember> members) {
        return members.stream()
                .filter(member -> !Boolean.TRUE.equals(member.getIsDeleted()))
                .map(member -> new FounderCandidate(
                        normalizeStudentId(member.getStudentId()),
                        normalizeRole(member.getProposedRole())
                ))
                .collect(Collectors.toList());
    }

    private String normalizeStudentId(String studentId) {
        return studentId == null ? "" : studentId.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_REGISTRATION_STATUSES.contains(normalizedStatus)) {
            throw new BusinessRuleException(
                    "Status must be PENDING, APPROVED, or REJECTED.",
                    HttpStatus.BAD_REQUEST
            );
        }
        return normalizedStatus;
    }

    private ClubRegistrationResponseDTO mapToResponse(ClubRegistration registration) {
        ClubRegistrationResponseDTO dto = new ClubRegistrationResponseDTO();
        dto.setRegistrationID(registration.getRegistrationID());
        dto.setClubCode(registration.getClubCode());
        dto.setClubName(registration.getClubName());
        dto.setClubNameEn(registration.getClubNameEn());
        dto.setCategory(registration.getCategory());
        dto.setClubImage(registration.getClubImage());
        dto.setClubImagePublicId(registration.getClubImagePublicId());
        dto.setDescription(registration.getDescription());
        dto.setMission(registration.getMission());
        dto.setUniqueness(registration.getUniqueness());
        dto.setOrgStructure(registration.getOrgStructure());
        dto.setMeetingFrequency(registration.getMeetingFrequency());
        dto.setMeetingLocation(registration.getMeetingLocation());
        dto.setFinancialPlan(registration.getFinancialPlan());

        dto.setStatus(registration.getStatus());
        dto.setIcpdpComment(registration.getIcpdpComment());
        dto.setCreatedBy(registration.getCreatedBy());
        dto.setCreatedAt(registration.getCreatedAt());
        dto.setUpdatedAt(registration.getUpdatedAt());

        userRepository.findById(registration.getCreatedBy()).ifPresent(user -> dto.setCreatorName(user.getFullName()));

        if (registration.getFoundingMembers() != null) {
            List<ClubRegistrationResponseDTO.FoundingMemberResponseDTO> membersList = registration.getFoundingMembers().stream()
                    .filter(member -> !Boolean.TRUE.equals(member.getIsDeleted()))
                    .map(fm -> {
                        ClubRegistrationResponseDTO.FoundingMemberResponseDTO fmDto = new ClubRegistrationResponseDTO.FoundingMemberResponseDTO();
                        fmDto.setMemberID(fm.getMemberID());
                        fmDto.setStudentId(fm.getStudentId());
                        fmDto.setProposedRole(fm.getProposedRole());
                        fmDto.setFullName(fm.getFullName());
                        fmDto.setEmail(fm.getEmail());
                        fmDto.setPhoneNumber(fm.getPhoneNumber());
                        fmDto.setCohort(fm.getCohort());
                        fmDto.setClazz(fm.getClazz());
                        fmDto.setFacebookLink(fm.getFacebookLink());
                        fmDto.setCardImage(fm.getCardImage());
                        fmDto.setCardImagePublicId(fm.getCardImagePublicId());
                        return fmDto;
                    })
                    .collect(Collectors.toList());
            dto.setFoundingMembers(membersList);
        }

        return dto;
    }

    private record FounderCandidate(String studentId, String proposedRole) {
    }

    private record FoundingMemberValidation(
            List<FounderCandidate> candidates,
            Map<String, UserAccount> usersByStudentId
    ) {
    }
}
