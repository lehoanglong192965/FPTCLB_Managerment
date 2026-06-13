package com.fptu.fcms.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClubResponse {
    private Integer clubID;
    private String clubCode;
    private String clubName;
    private String description;
    private String applicationFormQuestions;
    private String clubStatus;
    private LocalDateTime createdAt;
    
    // Additional fields for frontend display
    private Integer leaderId;
    private String leaderName;
    private String leaderStudentId;
    private Integer membersCount;
}
