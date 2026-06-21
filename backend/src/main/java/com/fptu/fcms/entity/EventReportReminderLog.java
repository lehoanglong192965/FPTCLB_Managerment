package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventReportReminderLog")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventReportReminderLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reminderID")
    private Integer reminderID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "reminderType")
    private String reminderType;

    @Column(name = "sentAt")
    private LocalDateTime sentAt;

    @org.hibernate.annotations.Nationalized
    @Column(name = "recipientEmails")
    private String recipientEmails;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}