package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberRankingDTO {
    private Integer rank;
    private Integer userId;
    private String fullName;
    private String email;
    private Integer clubId;
    private String clubName;
    private Integer totalScore;
    private Integer contributionPoint;
    private Integer eventParticipationPoint;
    private Integer performancePoint;
}
