package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;
import jakarta.persistence.*;
import lombok.*;

@Entity
@SQLRestriction("isDeleted = 0")
@Table(name = "ClubRegistrationMember")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubRegistrationMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "memberID")
    private Integer memberID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrationID", nullable = false)
    private ClubRegistration registration;

    @Column(name = "studentId", nullable = false)
    private String studentId;

    @Column(name = "proposedRole", nullable = false)
    private String proposedRole;

    @org.hibernate.annotations.Nationalized
    @Column(name = "fullName", nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phoneNumber", nullable = false)
    private String phoneNumber;

    @Column(name = "cohort")
    private String cohort;

    @Column(name = "clazz")
    private String clazz;

    @Column(name = "facebookLink")
    private String facebookLink;

    @Column(name = "cardImage")
    private String cardImage;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted;
}
