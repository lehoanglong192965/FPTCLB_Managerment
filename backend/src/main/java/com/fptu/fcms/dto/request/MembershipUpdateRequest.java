package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Request body cho API thay đổi Ban điều hành CLB.
 *
 * action = "APPOINT" → Bổ nhiệm targetUserID làm targetRole trong clubID.
 * action = "DISMISS"  → Bãi nhiệm targetUserID khỏi chức vụ hiện tại trong clubID.
 */
public record MembershipUpdateRequest(

        @NotNull(message = "clubID không được để trống")
        Integer clubID,

        @NotNull(message = "targetUserID không được để trống")
        Integer targetUserID,

        /**
         * APPOINT | DISMISS
         */
        @NotNull(message = "action không được để trống")
        @Pattern(regexp = "APPOINT|DISMISS", message = "action chỉ nhận APPOINT hoặc DISMISS")
        String action,

        /**
         * LEADER | VICE_LEADER | MEMBER  — bắt buộc khi action=APPOINT
         */
        @Pattern(regexp = "LEADER|VICE_LEADER|MEMBER",
                 message = "targetRole chỉ nhận LEADER, VICE_LEADER hoặc MEMBER")
        String targetRole,

        /**
         * Lý do thay đổi — bắt buộc để ghi AuditLog
         */
        @NotBlank(message = "reason không được để trống")
        String reason
) {}
