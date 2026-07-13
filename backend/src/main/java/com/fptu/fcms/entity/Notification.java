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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "tblNotifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notificationID")
    private Integer notificationID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clubID")
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createdBy", nullable = false)
    private UserAccount createdBy;

    @Nationalized
    @Column(name = "title", columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(name = "notificationType", length = 50)
    private String notificationType;

    @Nationalized
    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "createdAt", columnDefinition = "DATETIME2")
    private LocalDateTime createdAt;

    @Column(name = "actionUrl", length = 500)
    private String actionUrl;

    @Nationalized
    @Column(name = "actionLabel", length = 100)
    private String actionLabel;

    @Column(name = "isDeleted")
    private Boolean isDeleted;
}
