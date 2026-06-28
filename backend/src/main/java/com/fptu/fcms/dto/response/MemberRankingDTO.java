package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberRankingDTO {
    private Integer rank;
    private Integer userId;
    private String fullName;
    private String email;
    private String studentId;
    private String clubRoleName;
    private String memberTier;
    private String memberTierDescription;
    private Integer clubId;
    private String clubName;
    private Integer totalScore;
    private Integer contributionPoint;
    private Integer eventParticipationPoint;
    private Integer performancePoint;
}
