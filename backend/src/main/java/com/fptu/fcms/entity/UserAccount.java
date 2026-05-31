package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "UserAccount")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userID")
    private Integer userID;

    /** FK → SystemRole.roleID  (1=Admin, 2=ICPDP, 3=Student) */
    @Column(name = "roleID", nullable = false)
    private Integer roleID;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "fullName", nullable = false, length = 100)
    private String fullName;

    @Column(name = "major", length = 100)
    private String major;

    /** Active | Suspended */
    @Column(name = "accountStatus", nullable = false, length = 20)
    private String accountStatus = "Active";

    @Column(name = "createdAt", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;
}
