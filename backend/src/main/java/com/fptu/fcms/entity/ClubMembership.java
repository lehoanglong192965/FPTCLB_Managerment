package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ClubMembership")
public class ClubMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer membershipID;

    @Column(nullable = false)
    private Integer clubID;

    @Column(nullable = false)
    private Integer userID;

    @Column(nullable = false)
    private Integer semesterID;

    @Column(nullable = false)
    private Integer clubRoleID; // 1: Leader, 2: ViceLeader, 3: Member

    @Column(nullable = false)
    private LocalDate joinedDate = LocalDate.now();

    @Column(nullable = false)
    private Boolean isDeleted = false; // Phục vụ Soft Delete (BR-G04)
}