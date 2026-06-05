package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.UpdateProfileRequest;
import com.fptu.fcms.dto.response.UserProfileResponse;

public interface UserService {
    UserProfileResponse getProfile(Integer userId);
    UserProfileResponse updateProfile(Integer userId, UpdateProfileRequest request);
}
