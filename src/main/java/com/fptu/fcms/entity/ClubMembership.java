package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "club_memberships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long membershipId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(nullable = false)
    private String status; // e.g. "Active", "Inactive"
}
