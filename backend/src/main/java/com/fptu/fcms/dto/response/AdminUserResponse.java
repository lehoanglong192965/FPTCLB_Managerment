package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO trả về cho trang Admin quản lý người dùng.
 * Không bao giờ trả về password.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {

    private Integer userID;
    private Integer roleID;
    private String email;
    private String fullName;
    private String studentId;
    private String phoneNumber;
    private String major;
    private String accountStatus;
    private LocalDateTime createdAt;
}
