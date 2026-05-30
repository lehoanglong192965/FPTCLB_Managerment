package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "ClubBlacklist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClubBlacklist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blacklistID")
    private Integer blacklistID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "reason")
    private String reason;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}
