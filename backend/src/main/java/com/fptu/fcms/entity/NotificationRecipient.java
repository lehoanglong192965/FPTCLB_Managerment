package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "tblNotificationRecipients",
        uniqueConstraints = @UniqueConstraint(columnNames = {"notificationID", "userID"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipientID")
    private Integer recipientID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notificationID", nullable = false)
    private Notification notification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userID", nullable = false)
    private UserAccount user;

    @Column(name = "isRead")
    private Boolean isRead;

    @Column(name = "readAt", columnDefinition = "DATETIME2")
    private LocalDateTime readAt;

    @Column(name = "createdAt", columnDefinition = "DATETIME2")
    private LocalDateTime createdAt;
}