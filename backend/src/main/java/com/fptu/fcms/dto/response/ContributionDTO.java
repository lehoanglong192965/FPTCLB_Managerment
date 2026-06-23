package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContributionDTO {
    private Integer userID;
    private String userName;
    private String contributionType; // CORE_TEAM, SUPPORT_ORGANIZER, PARTICIPANT, ABSENT
}
