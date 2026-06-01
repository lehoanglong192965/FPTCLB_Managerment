package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO cho API thay đổi Ban điều hành CLB.
 *
 * Dùng cho cả hai hành động:
 *   - BỔ NHIỆM (APPOINT): Gán vai trò Leader / ViceLeader / Member cho một user
 *   - BÃI NHIỆM (DISMISS): Xóa mềm membership của một user khỏi CLB
 *
 * Endpoint: PUT /api/clubs/{clubId}/board
 */
public class ClubBoardChangeRequest {

    /**
     * ID của user cần bổ nhiệm hoặc bãi nhiệm.
     * User phải tồn tại trong hệ thống và có accountStatus = Active.
     */
    @NotNull(message = "userID không được để trống")
    private Integer userID;

    /**
     * Loại hành động cần thực hiện.
     * Chỉ chấp nhận: "APPOINT" (bổ nhiệm) hoặc "DISMISS" (bãi nhiệm).
     */
    @NotNull(message = "action không được để trống")
    @Pattern(regexp = "APPOINT|DISMISS", message = "action phải là APPOINT hoặc DISMISS")
    private String action;

    /**
     * Tên vai trò CLB muốn gán khi action = APPOINT.
     * Chỉ chấp nhận: "Leader", "ViceLeader", "Member".
     * Bắt buộc khi action = APPOINT; bỏ qua khi action = DISMISS.
     */
    @Pattern(regexp = "Leader|ViceLeader|Member",
            message = "newRole phải là Leader, ViceLeader, hoặc Member")
    private String newRole;

    /**
     * Lý do thực hiện thay đổi (phục vụ ghi AuditLog).
     * Khuyến khích điền khi bổ nhiệm Leader; tùy chọn cho các hành động khác.
     */
    private String reason;

    // =====================================================================
    // Getters & Setters (viết thủ công để tránh import Lombok thêm vào DTO)
    // =====================================================================

    public Integer getUserID() { return userID; }
    public void setUserID(Integer userID) { this.userID = userID; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getNewRole() { return newRole; }
    public void setNewRole(String newRole) { this.newRole = newRole; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}