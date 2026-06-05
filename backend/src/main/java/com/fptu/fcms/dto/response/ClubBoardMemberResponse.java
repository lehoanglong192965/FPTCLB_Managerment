package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho thông tin một thành viên trong Ban điều hành CLB.
 *
 * Trả về sau khi bổ nhiệm/bãi nhiệm thành công, hoặc trong GET danh sách ban điều hành.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubBoardMemberResponse {

    /** ID bản ghi membership */
    private Integer membershipID;

    /** ID của user */
    private Integer userID;

    /** Họ tên đầy đủ của user */
    private String fullName;

    /** Email FPT của user */
    private String email;

    /** Tên vai trò CLB hiện tại: Leader / ViceLeader / Member */
    private String clubRoleName;

    /** ID học kỳ đang active */
    private Integer semesterID;

    /** Mã học kỳ (ví dụ: SU26) */
    private String semesterCode;

    /** ID CLB */
    private Integer clubID;
}