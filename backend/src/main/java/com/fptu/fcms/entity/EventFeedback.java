package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventFeedback", indexes = {
        @Index(name = "IX_EventFeedback_Event_Registration", columnList = "eventID,registrationID"),
        @Index(name = "IX_EventFeedback_Event_GuestRegistration", columnList = "eventID,guestRegistrationID")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedbackID")
    private Integer feedbackID;

    @Column(name = "eventID", nullable = false)
    private Integer eventID;

    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "guestRegistrationID")
    private Integer guestRegistrationID;

    @Column(name = "contentRating", nullable = false)
    private Integer contentRating;

    @Column(name = "organizationRating", nullable = false)
    private Integer organizationRating;

    @Column(name = "logisticsRating", nullable = false)
    private Integer logisticsRating;

    @Column(name = "overallRating", nullable = false)
    private Integer overallRating;

    @Column(name = "comment", columnDefinition = "NVARCHAR(MAX)")
    private String comment;

    @Column(name = "isIncludedInExternalScore", nullable = false)
    private Boolean isIncludedInExternalScore = false;

    @Column(name = "submittedAt", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    private void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (submittedAt == null) {
            submittedAt = now;
        }
        if (createdAt == null) {
            createdAt = submittedAt != null ? submittedAt : now;
        }
        updatedAt = now;
        if (isIncludedInExternalScore == null) {
            isIncludedInExternalScore = false;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (isIncludedInExternalScore == null) {
            isIncludedInExternalScore = false;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
