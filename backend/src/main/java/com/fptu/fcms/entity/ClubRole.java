package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "ClubRole")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClubRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clubRoleID")
    private Integer clubRoleID;

    @Column(name = "roleName")
    private String roleName;

    @Column(name = "description")
    private String description;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}

