package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "ClubMembership")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClubMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "membershipID")
    private Integer membershipID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Column(name = "clubRoleID")
    private Integer clubRoleID;

    @Column(name = "joinedDate")
    private LocalDate joinedDate;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}

