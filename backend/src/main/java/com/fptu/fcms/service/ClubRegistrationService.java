package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.FoundingMemberDTO;
import com.fptu.fcms.dto.request.ReviewRegistrationRequestDTO;
import com.fptu.fcms.dto.response.ClubRegistrationResponseDTO;
import com.fptu.fcms.entity.*;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClubRegistrationService {

    private final ClubRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final SemesterRepository semesterRepository;

    @Transactional
    public ClubRegistrationResponseDTO submitRegistration(ClubRegistrationRequestDTO request, Integer currentUserId) {
        // Validate active semester
        Semester activeSemester = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("Không có học kỳ nào đang hoạt động (Active)."));

        // Validation 1: Check club name and code uniqueness
        if (clubRepository.existsByClubCode(request.getClubCode())) {
            throw new BusinessRuleException("Mã câu lạc bộ đã tồn tại trong hệ thống.");
        }
        if (clubRepository.existsByClubName(request.getClubName())) {
            throw new BusinessRuleException("Tên câu lạc bộ đã tồn tại trong hệ thống.");
        }

        // Ensure there is exactly 1 Leader and 1 ViceLeader
        long leaderCount = request.getFoundingMembers().stream().filter(m -> "Leader".equals(m.getProposedRole())).count();
        long viceLeaderCount = request.getFoundingMembers().stream().filter(m -> "ViceLeader".equals(m.getProposedRole())).count();
        if (leaderCount != 1 || viceLeaderCount != 1) {
            throw new BusinessRuleException("Câu lạc bộ phải có chính xác 1 Chủ nhiệm và 1 Phó chủ nhiệm trong danh sách thành viên sáng lập.");
        }

        // Gather all student IDs in the proposal
        List<String> proposedStudentIds = request.getFoundingMembers().stream()
                .map(FoundingMemberDTO::getStudentId)
                .collect(Collectors.toList());

        Set<String> uniqueStudentIds = new HashSet<>();

        // Validation 2: Ensure all proposed members have registered user accounts and check club limits
        for (String studentId : proposedStudentIds) {
            if (!uniqueStudentIds.add(studentId)) {
                throw new BusinessRuleException("Danh sách thành viên sáng lập có sinh viên bị trùng lặp (MSSV: " + studentId + ").");
            }

            UserAccount user = userRepository.findByStudentIdAndIsDeletedFalse(studentId)
                    .orElseThrow(() -> new BusinessRuleException("Sinh viên có MSSV: " + studentId + " chưa đăng ký tài khoản trên hệ thống."));

            // Check 4-club limit
            int activeClubs = clubMembershipRepository.countByUserIDAndSemesterIDAndIsDeletedFalse(user.getUserID(), activeSemester.getSemesterID());
            if (activeClubs >= 4) {
                throw new BusinessRuleException("Sinh viên " + user.getFullName() + " (MSSV: " + studentId + ") đã tham gia tối đa 4 câu lạc bộ trong học kỳ này.");
            }
        }

        // Map DTO to Entity
        ClubRegistration registration = ClubRegistration.builder()
                .clubCode(request.getClubCode())
                .clubName(request.getClubName())
                .clubNameEn(request.getClubNameEn())
                .category(request.getCategory())
                .description(request.getDescription())
                .mission(request.getMission())
                .uniqueness(request.getUniqueness())
                .orgStructure(request.getOrgStructure())
                .meetingFrequency(request.getMeetingFrequency())
                .meetingLocation(request.getMeetingLocation())
                .financialPlan(request.getFinancialPlan())
                .status("PENDING")
                .createdBy(currentUserId)
                .createdAt(LocalDateTime.now())
                .isDeleted(false)
                .build();

        List<ClubRegistrationMember> members = request.getFoundingMembers().stream().map(fm -> 
            ClubRegistrationMember.builder()
                    .registration(registration)
                    .studentId(fm.getStudentId())
                    .proposedRole(fm.getProposedRole())
                    .fullName(fm.getFullName())
                    .email(fm.getEmail())
                    .phoneNumber(fm.getPhoneNumber())
                    .cohort(fm.getCohort())
                    .clazz(fm.getClazz())
                    .facebookLink(fm.getFacebookLink())
                    .cardImage(fm.getCardImage())
                    .isDeleted(false)
                    .build()
        ).collect(Collectors.toList());

        registration.setFoundingMembers(members);

        ClubRegistration saved = registrationRepository.save(registration);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ClubRegistrationResponseDTO> getMyRegistrations(Integer currentUserId) {
        return registrationRepository.findByCreatedByAndIsDeletedFalse(currentUserId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClubRegistrationResponseDTO> getPendingRegistrations() {
        return registrationRepository.findByStatusAndIsDeletedFalse("PENDING").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClubRegistrationResponseDTO getRegistrationById(Integer id) {
        ClubRegistration registration = registrationRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy đơn đăng ký thành lập CLB."));
        return mapToResponse(registration);
    }

    @Transactional
    public ClubRegistrationResponseDTO reviewRegistration(Integer id, ReviewRegistrationRequestDTO request, Integer reviewerId) {
        ClubRegistration registration = registrationRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy đơn đăng ký thành lập CLB."));

        if (!"PENDING".equals(registration.getStatus())) {
            throw new BusinessRuleException("Đơn đăng ký này đã được phê duyệt hoặc từ chối từ trước.");
        }

        Semester activeSemester = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("Không có học kỳ nào đang hoạt động (Active)."));

        if ("APPROVED".equals(request.getStatus())) {
            // Re-verify club code/name uniqueness at approval time
            if (clubRepository.existsByClubCode(registration.getClubCode())) {
                throw new BusinessRuleException("Mã câu lạc bộ đã tồn tại trong hệ thống.");
            }
            if (clubRepository.existsByClubName(registration.getClubName())) {
                throw new BusinessRuleException("Tên câu lạc bộ đã tồn tại trong hệ thống.");
            }

            // Re-verify all student IDs existence and 4-club limit
            List<String> proposedStudentIds = registration.getFoundingMembers().stream()
                .map(ClubRegistrationMember::getStudentId)
                .collect(Collectors.toList());

            Set<String> uniqueStudentIds = new HashSet<>();
            List<UserAccount> membersToAssign = new ArrayList<>();
            for (String studentId : proposedStudentIds) {
                if (!uniqueStudentIds.add(studentId)) {
                    throw new BusinessRuleException("Đơn đăng ký không hợp lệ: Danh sách thành viên sáng lập có sinh viên bị trùng lặp (MSSV: " + studentId + "). Vui lòng Từ chối đơn này.");
                }

                UserAccount user = userRepository.findByStudentIdAndIsDeletedFalse(studentId)
                        .orElseThrow(() -> new BusinessRuleException("Sinh viên có MSSV: " + studentId + " chưa đăng ký tài khoản trên hệ thống."));

                // Check 4-club limit
                int activeClubs = clubMembershipRepository.countByUserIDAndSemesterIDAndIsDeletedFalse(user.getUserID(), activeSemester.getSemesterID());
                if (activeClubs >= 4) {
                    throw new BusinessRuleException("Sinh viên " + user.getFullName() + " (MSSV: " + studentId + ") đã tham gia tối đa 4 câu lạc bộ.");
                }
                membersToAssign.add(user);
            }

            // 1. Create the new Club
            Club club = new Club();
            club.setClubCode(registration.getClubCode());
            club.setClubName(registration.getClubName());
            club.setDescription(registration.getDescription());
            club.setClubStatus("Active");
            club.setCreatedAt(LocalDateTime.now());
            club.setIsDeleted(false);
            club = clubRepository.save(club);

            // 2. Fetch roles
            ClubRole leaderRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse("Leader")
                    .orElseThrow(() -> new BusinessRuleException("Không tìm thấy vai trò Leader trong hệ thống."));
            ClubRole viceLeaderRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse("ViceLeader")
                    .orElseThrow(() -> new BusinessRuleException("Không tìm thấy vai trò ViceLeader trong hệ thống."));
            ClubRole memberRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse("Member")
                    .orElseThrow(() -> new BusinessRuleException("Không tìm thấy vai trò Member trong hệ thống."));

            // 3. Create memberships for all founding members
            for (ClubRegistrationMember fm : registration.getFoundingMembers()) {
                UserAccount fmUser = userRepository.findByStudentIdAndIsDeletedFalse(fm.getStudentId()).get();
                ClubMembership fmMembership = new ClubMembership();
                fmMembership.setClubID(club.getClubID());
                fmMembership.setUserID(fmUser.getUserID());
                fmMembership.setSemesterID(activeSemester.getSemesterID());
                
                Integer roleId;
                if ("Leader".equals(fm.getProposedRole())) {
                    roleId = leaderRole.getClubRoleID();
                } else if ("ViceLeader".equals(fm.getProposedRole())) {
                    roleId = viceLeaderRole.getClubRoleID();
                } else {
                    roleId = memberRole.getClubRoleID();
                }
                fmMembership.setClubRoleID(roleId);
                
                fmMembership.setJoinedDate(LocalDate.now());
                fmMembership.setIsDeleted(false);
                clubMembershipRepository.save(fmMembership);
            }

            registration.setStatus("APPROVED");
        } else if ("REJECTED".equals(request.getStatus())) {
            registration.setStatus("REJECTED");
        } else {
            throw new BusinessRuleException("Trạng thái duyệt không hợp lệ (APPROVED hoặc REJECTED).");
        }

        registration.setIcpdpComment(request.getIcpdpComment());
        registration.setUpdatedAt(LocalDateTime.now());
        ClubRegistration saved = registrationRepository.save(registration);

        return mapToResponse(saved);
    }

    private ClubRegistrationResponseDTO mapToResponse(ClubRegistration registration) {
        ClubRegistrationResponseDTO dto = new ClubRegistrationResponseDTO();
        dto.setRegistrationID(registration.getRegistrationID());
        dto.setClubCode(registration.getClubCode());
        dto.setClubName(registration.getClubName());
        dto.setClubNameEn(registration.getClubNameEn());
        dto.setCategory(registration.getCategory());
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

        // Get creator name
        userRepository.findById(registration.getCreatedBy()).ifPresent(user -> dto.setCreatorName(user.getFullName()));

        if (registration.getFoundingMembers() != null) {
            List<ClubRegistrationResponseDTO.FoundingMemberResponseDTO> membersList = registration.getFoundingMembers().stream().map(fm -> {
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
                return fmDto;
            }).collect(Collectors.toList());
            dto.setFoundingMembers(membersList);
        }

        return dto;
    }
}
