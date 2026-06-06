package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.UpdateProfileRequest;
import com.fptu.fcms.dto.response.UserProfileResponse;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

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
                user.getRoleID()
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

        userRepository.save(user);

        return new UserProfileResponse(
                user.getUserID(),
                user.getEmail(),
                user.getFullName(),
                user.getMajor() != null ? user.getMajor() : "NULL",
                user.getRoleID()
        );
    }
}
