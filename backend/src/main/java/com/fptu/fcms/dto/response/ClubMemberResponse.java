package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO cho danh sách toàn bộ thành viên trong một CLB.
 * Dùng cho endpoint GET /api/clubs/{clubId}/members
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubMemberResponse {

    private Integer membershipID;

    private Integer userID;

    private String fullName;

    private String email;

    private String phone;

    private String studentCode;

    private String major;

    private String clubRoleName;

    private Integer semesterID;

    private String semesterCode;

    private LocalDate joinedDate;
}
