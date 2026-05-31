package com.fptu.fcms.dto.response;

/**
 * Thông tin hồ sơ người dùng trả về cho client.
 */
public record UserProfileResponse(
        Integer userID,
        String  email,
        String  fullName,
        String  major,
        String  accountStatus,
        String  systemRoleName   // Admin | ICPDP | Student
) {}
