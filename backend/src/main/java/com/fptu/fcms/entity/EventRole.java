package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventRole")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "eventRoleID")
    private Integer eventRoleID;

    @Column(name = "roleName")
    private String roleName;

    @Column(name = "description")
    private String description;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}

