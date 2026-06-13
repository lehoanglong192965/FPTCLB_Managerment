package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.UpdateProfileRequest;
import com.fptu.fcms.dto.response.UserProfileResponse;
import com.fptu.fcms.dto.response.ClubRoleResponse;
import com.fptu.fcms.service.UserService;
import com.fptu.fcms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Integer userId = currentUser.getUserId();
            UserProfileResponse response = userService.getProfile(userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Integer userId = currentUser.getUserId();
            UserProfileResponse response = userService.updateProfile(userId, request);
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật hồ sơ thành công!",
                    "fullName", response.getFullName(),
                    "major", response.getMajor(),
                    "phone",response.getPhoneNumber()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-club-role")
    public ResponseEntity<?> getMyClubRole(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Integer userId = currentUser.getUserId();
            ClubRoleResponse response = userService.getClubRole(userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-student-id/{studentId}")
    public ResponseEntity<?> getUserByStudentId(@PathVariable String studentId) {
        try {
            UserProfileResponse response = userService.getProfileByStudentId(studentId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}