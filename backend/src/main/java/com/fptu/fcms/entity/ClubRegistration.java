package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@SQLRestriction("isDeleted = 0")
@Table(name = "ClubRegistration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "clubCode", nullable = false)
    private String clubCode;

    @org.hibernate.annotations.Nationalized
    @Column(name = "clubName", nullable = false)
    private String clubName;

    @Column(name = "clubNameEn")
    private String clubNameEn;

    @org.hibernate.annotations.Nationalized
    @Column(name = "category", nullable = false)
    private String category;

    @org.hibernate.annotations.Nationalized
    @Column(name = "description")
    private String description;

    @org.hibernate.annotations.Nationalized
    @Column(name = "mission", nullable = false)
    private String mission;

    @org.hibernate.annotations.Nationalized
    @Column(name = "uniqueness", nullable = false)
    private String uniqueness;

    @org.hibernate.annotations.Nationalized
    @Column(name = "orgStructure", nullable = false)
    private String orgStructure;

    @org.hibernate.annotations.Nationalized
    @Column(name = "meetingFrequency", nullable = false)
    private String meetingFrequency;

    @org.hibernate.annotations.Nationalized
    @Column(name = "meetingLocation", nullable = false)
    private String meetingLocation;

    @org.hibernate.annotations.Nationalized
    @Column(name = "financialPlan", nullable = false)
    private String financialPlan;

    // Leader info
    @Column(name = "leaderStudentId", nullable = false)
    private String leaderStudentId;

    @org.hibernate.annotations.Nationalized
    @Column(name = "leaderName", nullable = false)
    private String leaderName;

    @Column(name = "leaderEmail", nullable = false)
    private String leaderEmail;

    @Column(name = "leaderPhone", nullable = false)
    private String leaderPhone;

    @Column(name = "leaderCohort")
    private String leaderCohort;

    @Column(name = "leaderClass")
    private String leaderClass;

    @Column(name = "leaderFb")
    private String leaderFb;

    @Column(name = "leaderExperience")
    private String leaderExperience;

    @Column(name = "leaderCardImage", nullable = false)
    private String leaderCardImage;

    // Vice Leader info
    @Column(name = "viceLeaderStudentId", nullable = false)
    private String viceLeaderStudentId;

    @org.hibernate.annotations.Nationalized
    @Column(name = "viceLeaderName", nullable = false)
    private String viceLeaderName;

    @Column(name = "viceLeaderEmail", nullable = false)
    private String viceLeaderEmail;

    @Column(name = "viceLeaderPhone", nullable = false)
    private String viceLeaderPhone;

    @Column(name = "viceLeaderCohort")
    private String viceLeaderCohort;

    @Column(name = "viceLeaderClass")
    private String viceLeaderClass;

    @Column(name = "viceLeaderFb")
    private String viceLeaderFb;

    @Column(name = "viceLeaderExperience")
    private String viceLeaderExperience;

    @Column(name = "viceLeaderCardImage", nullable = false)
    private String viceLeaderCardImage;

    // Status
    @Column(name = "status", nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @org.hibernate.annotations.Nationalized
    @Column(name = "icpdpComment")
    private String icpdpComment;

    @Column(name = "createdBy", nullable = false)
    private Integer createdBy;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "registrationID")
    @Builder.Default
    private List<ClubRegistrationMember> foundingMembers = new ArrayList<>();
}
