package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.UpdateProfileRequest;
import com.fptu.fcms.dto.response.UserProfileResponse;
import com.fptu.fcms.dto.response.ClubRoleResponse;

public interface UserService {
    UserProfileResponse getProfile(Integer userId);
    UserProfileResponse getProfileByStudentId(String studentId);
    UserProfileResponse updateProfile(Integer userId, UpdateProfileRequest request);
    ClubRoleResponse getClubRole(Integer userId);
}
