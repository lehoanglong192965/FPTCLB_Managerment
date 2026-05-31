package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ClubRole")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clubRoleID")
    private Integer clubRoleID;

    /** Leader (1) | ViceLeader (2) | Member (3) */
    @Column(name = "roleName", nullable = false, unique = true, length = 30)
    private String roleName;

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;
}
