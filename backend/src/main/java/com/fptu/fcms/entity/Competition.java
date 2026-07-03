package com.fptu.fcms.entity;

import com.fptu.fcms.enums.CompetitionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Competition")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Competition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "competitionID")
    private Integer competitionID;

    @Column(name = "clubID", nullable = false)
    private Integer clubID;

    @Column(name = "semesterID", nullable = false)
    private Integer semesterID;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Convert(converter = CompetitionStatusConverter.class)
    @Column(name = "status", nullable = false, length = 20)
    private CompetitionStatus status = CompetitionStatus.DRAFT;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    @PreUpdate
    private void normalizeLifecycle() {
        if (status == null) {
            status = CompetitionStatus.DRAFT;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
