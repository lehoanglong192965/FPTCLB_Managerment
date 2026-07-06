package com.fptu.fcms.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContributionDTO {
    private Integer contributionID;
    private Integer batchID;
    private Integer eventID;
    private Integer clubID;
    private String eventName;
    private LocalDateTime eventStartDate;
    private String batchStatus;
    private LocalDateTime appealClosesAt;
    private Integer appealID;
    private String appealStatus;
    private String appealReason;
    private String appealResolutionNote;
    private LocalDateTime appealRequestedAt;
    private LocalDateTime appealResolvedAt;

    @JsonAlias("userId")
    private Integer userID;

    private String userName;

    private Integer registrationID;
    private Integer attendanceRecordID;
    private Integer assignmentID;
    private Integer membershipID;
    private Integer clubRoleIDSnapshot;
    private String clubRoleSnapshot;
    private Boolean individualRankingEligible;

    private String contributionType; // CORE_TEAM, SUPPORT_ORGANIZER, PARTICIPANT, ABSENT
    private String leaderEvaluation; // GOOD, NOT_GOOD
    private String tier; // A, B, C, D
    private String rationale;

    private Integer basePoints;
    private Integer bonusPoints;
    private Integer penaltyPoints;
    private Integer finalPoints;
    private String status;

    public ContributionDTO(Integer userID, String userName, String contributionType, String leaderEvaluation) {
        this.userID = userID;
        this.userName = userName;
        this.contributionType = contributionType;
        this.leaderEvaluation = leaderEvaluation;
    }
}
