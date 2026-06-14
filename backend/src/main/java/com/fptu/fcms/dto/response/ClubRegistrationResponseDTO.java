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
        private String proposedRole;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String cohort;
        private String clazz;
        private String facebookLink;
        private String cardImage;
    }
}
