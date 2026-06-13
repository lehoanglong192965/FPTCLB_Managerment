package com.fptu.fcms.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ClubRegistrationResponseDTO {
    private Integer registrationID;
    private String clubCode;
    private String clubName;
    private String clubNameEn;
    private String category;
    private String description;
    private String mission;
    private String uniqueness;
    private String orgStructure;
    private String meetingFrequency;
    private String meetingLocation;
    private String financialPlan;

    // Leader info
    private String leaderStudentId;
    private String leaderName;
    private String leaderEmail;
    private String leaderPhone;
    private String leaderCohort;
    private String leaderClass;
    private String leaderFb;
    private String leaderExperience;
    private String leaderCardImage;

    // Vice Leader info
    private String viceLeaderStudentId;
    private String viceLeaderName;
    private String viceLeaderEmail;
    private String viceLeaderPhone;
    private String viceLeaderCohort;
    private String viceLeaderClass;
    private String viceLeaderFb;
    private String viceLeaderExperience;
    private String viceLeaderCardImage;

    // Status
    private String status;
    private String icpdpComment;

    // Meta
    private Integer createdBy;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<FoundingMemberResponseDTO> foundingMembers;

    @Data
    public static class FoundingMemberResponseDTO {
        private Integer memberID;
        private String studentId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String cohort;
        private String clazz;
        private String facebookLink;
        private String cardImage;
    }
}
