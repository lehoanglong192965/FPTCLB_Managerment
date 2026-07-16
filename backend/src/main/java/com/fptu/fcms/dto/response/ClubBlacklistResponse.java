package com.fptu.fcms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Bản ghi blacklist kèm thông tin người bị cấm — entity ClubBlacklist chỉ lưu userID,
 * mà người bị cấm đã bị khai trừ khỏi CLB nên frontend không thể tra tên từ danh sách
 * thành viên; backend phải trả sẵn tên/MSSV/ngành từ UserAccount.
 */
@Data
@Builder
public class ClubBlacklistResponse {
    private Integer blacklistID;
    private Integer userID;
    private String fullName;
    private String studentCode;
    private String major;
    private String reason;
    private LocalDateTime createdAt;
}