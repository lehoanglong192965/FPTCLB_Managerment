package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.UpdateProfileRequest;
import com.fptu.fcms.dto.response.UserProfileResponse;
import com.fptu.fcms.dto.response.ClubRoleResponse;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final SemesterRepository semesterRepository;
    private final ClubRoleRepository clubRoleRepository;

    @Override
    public UserProfileResponse getProfile(Integer userId) {
        Optional<UserAccount> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy thông tin người dùng trong hệ thống!");
        }

        UserAccount user = userOptional.get();

        return new UserProfileResponse(
                user.getUserID(),
                user.getEmail(),
                user.getFullName(),
                user.getMajor() != null ? user.getMajor() : "NULL",
                user.getRoleID(),
                user.getStudentId(),
                user.getPhoneNumber()
        );
    }

    @Override
    public UserProfileResponse updateProfile(Integer userId, UpdateProfileRequest request) {
        Optional<UserAccount> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy thông tin người dùng trong hệ thống!");
        }

        UserAccount user = userOptional.get();

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName());
        }

        if (request.getMajor() != null && !request.getMajor().trim().isEmpty()) {
            user.setMajor(request.getMajor());
        }

        if(request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        userRepository.save(user);

        return new UserProfileResponse(
                user.getUserID(),
                user.getEmail(),
                user.getFullName(),
                user.getMajor() != null ? user.getMajor() : "NULL",
                user.getRoleID(),
                user.getStudentId(),
                user.getPhoneNumber()
        );
    }

    @Override
    public ClubRoleResponse getClubRole(Integer userId) {
        Optional<Semester> activeSemesterOpt = semesterRepository.findByIsActiveTrueAndIsDeletedFalse();
        if (activeSemesterOpt.isEmpty()) {
            return new ClubRoleResponse(3, null, "Member"); // Mặc định là Member nếu không có kỳ Active
        }
        Semester activeSemester = activeSemesterOpt.get();

        java.util.List<ClubMembership> memberships = clubMembershipRepository
                .findByUserIDAndSemesterIDAndIsDeletedFalse(userId, activeSemester.getSemesterID());

        if (memberships.isEmpty()) {
            return new ClubRoleResponse(3, null, "Member");
        }

        // Tìm membership có clubRoleID nhỏ nhất (ưu tiên 1: Leader > 2: ViceLeader > 3: Member)
        ClubMembership highestRoleMembership = memberships.stream()
                .min(java.util.Comparator.comparingInt(ClubMembership::getClubRoleID))
                .orElse(memberships.get(0));

        String roleName = clubRoleRepository.findById(highestRoleMembership.getClubRoleID())
                .map(cr -> cr.getRoleName())
                .orElse("Member");

        return new ClubRoleResponse(
                highestRoleMembership.getClubRoleID(),
                highestRoleMembership.getClubID(),
                roleName
        );
    }
}
