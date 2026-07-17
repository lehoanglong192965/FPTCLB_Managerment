package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.AdminUserResponse;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.fptu.fcms.dto.request.CreateIcpdpRequest;
import com.fptu.fcms.dto.response.ProvisionIcpdpResponse;
import com.fptu.fcms.enums.ProvisionIcpdpAction;
import com.fptu.fcms.service.AdminUserService;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

/**
 * REST Controller cho Admin quản lý tài khoản người dùng.
 * Base path: /api/admin/users
 */
@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin User Management", description = "API Admin xem danh sách và khóa/mở khóa tài khoản người dùng")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AdminUserController {

    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_SUSPENDED = "Suspended";

    private final UserRepository userRepository;
    private final AdminUserService adminUserService;

    @PostMapping("/icpdp")
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Cấp quyền/Tạo tài khoản ICPDP")
    public ResponseEntity<ProvisionIcpdpResponse> provisionIcpdp(
            @Valid @RequestBody CreateIcpdpRequest request,
            @AuthenticationPrincipal UserPrincipal currentAdmin) {

        ProvisionIcpdpResponse response =
                adminUserService.provisionIcpdp(request, currentAdmin.getUserId());

        HttpStatus status = response.getAction() == ProvisionIcpdpAction.CREATED
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity.status(status).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Lấy danh sách toàn bộ người dùng (chưa bị xóa mềm)")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        // @SQLRestriction("isDeleted = false") trên UserAccount đã tự loại user bị xóa mềm
        List<AdminUserResponse> users = userRepository.findAll().stream()
                .map(user -> AdminUserResponse.builder()
                        .userID(user.getUserID())
                        .roleID(user.getRoleID())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .studentId(user.getStudentId())
                        .phoneNumber(user.getPhoneNumber())
                        .major(user.getMajor())
                        .accountStatus(user.getAccountStatus())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{userId}/suspend")
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Tạm khóa tài khoản người dùng")
    public ResponseEntity<Map<String, String>> suspendUser(
            @PathVariable Integer userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserAccount user = findUserOrThrow(userId);
        if (currentUser != null && userId.equals(currentUser.getUserId())) {
            throw new BusinessRuleException("Không thể tự khóa tài khoản của chính mình.", HttpStatus.FORBIDDEN);
        }

        user.setAccountStatus(STATUS_SUSPENDED);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Đã tạm khóa tài khoản."));
    }

    @PutMapping("/{userId}/activate")
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Mở khóa tài khoản người dùng")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable Integer userId) {
        UserAccount user = findUserOrThrow(userId);
        user.setAccountStatus(STATUS_ACTIVE);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Đã mở khóa tài khoản."));
    }

    private UserAccount findUserOrThrow(Integer userId) {
        return userRepository.findByUserIDAndIsDeletedFalse(userId)
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy người dùng với ID: " + userId, HttpStatus.NOT_FOUND));
    }
}
