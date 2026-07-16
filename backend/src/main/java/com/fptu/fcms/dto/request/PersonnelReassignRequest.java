package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request cho API điều động nhân sự khẩn cấp của IC-PDP.
 * Endpoint: POST /api/icpdp/personnel-reassign
 */
public class PersonnelReassignRequest {

    @NotNull(message = "clubID không được để trống")
    private Integer clubID;

    /** "leader" = thay Trưởng CLB, "vice" = thay Phó Trưởng CLB */
    @NotBlank(message = "position không được để trống")
    @Pattern(regexp = "leader|vice", message = "position phải là 'leader' hoặc 'vice'")
    private String position;

    /** userID của người được bổ nhiệm vào vị trí */
    @NotNull(message = "newUserID không được để trống")
    private Integer newUserID;

    /** Mức độ vi phạm (tùy chọn, phục vụ lịch sử) */
    private String level;

    @NotBlank(message = "Lý do điều động không được để trống")
    @Size(min = 10, message = "Lý do điều động phải có ít nhất 10 ký tự")
    private String reason;

    public Integer getClubID() { return clubID; }
    public void setClubID(Integer clubID) { this.clubID = clubID; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Integer getNewUserID() { return newUserID; }
    public void setNewUserID(Integer newUserID) { this.newUserID = newUserID; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}