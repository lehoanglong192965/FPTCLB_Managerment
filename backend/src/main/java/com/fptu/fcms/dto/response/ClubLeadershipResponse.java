package com.fptu.fcms.dto.response;

import java.time.LocalDate;
import java.util.List;

/**
 * Danh sách Ban điều hành hiện tại của CLB trong học kỳ đang active.
 */
public record ClubLeadershipResponse(
        Integer                  clubID,
        Integer                  semesterID,
        String                   semesterCode,
        List<LeadershipMemberDto> members
) {
    public record LeadershipMemberDto(
            Integer   membershipID,
            Integer   userID,
            String    fullName,
            String    email,
            Integer   clubRoleID,
            String    roleName,       // Leader | ViceLeader | Member
            LocalDate joinedDate
    ) {}
}
