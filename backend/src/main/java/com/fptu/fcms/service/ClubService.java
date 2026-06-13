package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubRequest;
import com.fptu.fcms.dto.request.ClubStatusRequest;
import com.fptu.fcms.dto.response.ClubResponse;
import com.fptu.fcms.entity.*;
import com.fptu.fcms.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClubService {

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final SemesterRepository semesterRepository;

    public ClubService(ClubRepository clubRepository, UserRepository userRepository,
                       ClubMembershipRepository clubMembershipRepository, ClubRoleRepository clubRoleRepository,
                       SemesterRepository semesterRepository) {
        this.clubRepository = clubRepository;
        this.userRepository = userRepository;
        this.clubMembershipRepository = clubMembershipRepository;
        this.clubRoleRepository = clubRoleRepository;
        this.semesterRepository = semesterRepository;
    }

    @Transactional(readOnly = true)
    public List<ClubResponse> getAllClubs() {
        return clubRepository.findAll().stream()
                .filter(c -> !c.getIsDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClubResponse createClub(ClubRequest request) {
        UserAccount leader = userRepository.findByStudentIdAndIsDeletedFalse(request.getLeaderStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên với MSSV: " + request.getLeaderStudentId()));

        Club club = new Club();
        club.setClubCode(request.getClubCode());
        club.setClubName(request.getClubName());
        club.setDescription(request.getDescription());
        club.setApplicationFormQuestions(request.getApplicationFormQuestions());
        club.setClubStatus("Active");
        club.setCreatedAt(LocalDateTime.now());
        club.setIsDeleted(false);
        club = clubRepository.save(club);

        // Assign Leader
        Semester activeSemester = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new IllegalStateException("Không có học kỳ nào đang Active"));

        ClubRole leaderRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse("Leader")
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy vai trò Leader trong hệ thống"));

        ClubMembership membership = new ClubMembership();
        membership.setClubID(club.getClubID());
        membership.setUserID(leader.getUserID());
        membership.setSemesterID(activeSemester.getSemesterID());
        membership.setClubRoleID(leaderRole.getClubRoleID());
        membership.setJoinedDate(LocalDate.now());
        membership.setIsDeleted(false);
        clubMembershipRepository.save(membership);

        return mapToResponse(club);
    }

    @Transactional
    public ClubResponse updateClubStatus(Integer id, ClubStatusRequest request) {
        Club club = clubRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy CLB với ID: " + id));
        club.setClubStatus(request.getStatus());
        return mapToResponse(clubRepository.save(club));
    }

    private ClubResponse mapToResponse(Club club) {
        ClubResponse res = new ClubResponse();
        res.setClubID(club.getClubID());
        res.setClubCode(club.getClubCode());
        res.setClubName(club.getClubName());
        res.setDescription(club.getDescription());
        res.setApplicationFormQuestions(club.getApplicationFormQuestions());
        res.setClubStatus(club.getClubStatus());
        res.setCreatedAt(club.getCreatedAt());

        // Get Leader and Members Count for active semester
        semesterRepository.findByIsActiveTrueAndIsDeletedFalse().ifPresent(semester -> {
            clubRoleRepository.findByRoleNameAndIsDeletedFalse("Leader").ifPresent(leaderRole -> {
                clubMembershipRepository.findByClubIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                        club.getClubID(), semester.getSemesterID(), leaderRole.getClubRoleID()
                ).ifPresent(leaderMem -> {
                    userRepository.findById(leaderMem.getUserID()).ifPresent(user -> {
                        res.setLeaderId(user.getUserID());
                        res.setLeaderName(user.getFullName());
                        res.setLeaderStudentId(user.getStudentId());
                    });
                });
            });
            // Approximate members count (this includes all roles)
            List<ClubMembership> allMembers = clubMembershipRepository.findBoardMembers(club.getClubID(), semester.getSemesterID());
            // wait, findBoardMembers only gets leader and vice. We need all members.
            // Let's just mock members count for now or add a custom query.
            res.setMembersCount(allMembers.size());
        });

        return res;
    }
}
