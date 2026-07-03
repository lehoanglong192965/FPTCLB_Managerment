package com.fptu.fcms.entity;

import com.fptu.fcms.enums.FeedbackInvitationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventFeedbackInvitation", indexes = {
        @Index(name = "IX_FeedbackInvitation_TokenHash", columnList = "tokenHash"),
        @Index(name = "IX_FeedbackInvitation_Event_Status", columnList = "eventID,status"),
        @Index(name = "IX_FeedbackInvitation_Event_Registration", columnList = "eventID,registrationID"),
        @Index(name = "IX_FeedbackInvitation_Event_GuestRegistration", columnList = "eventID,guestRegistrationID")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedbackInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invitationID")
    private Integer invitationID;

    @Column(name = "eventID", nullable = false)
    private Integer eventID;

    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "guestRegistrationID")
    private Integer guestRegistrationID;

    @Column(name = "tokenHash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name = "expiresAt", nullable = false)
    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private FeedbackInvitationStatus status = FeedbackInvitationStatus.ACTIVE;

    @Column(name = "sentAt")
    private LocalDateTime sentAt;

    @Column(name = "usedAt")
    private LocalDateTime usedAt;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;
}