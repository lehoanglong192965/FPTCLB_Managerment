package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@SQLRestriction("1=1")
@Table(name = "RecruitmentReminder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentReminder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reminderID")
    private Integer reminderID;

    @Column(name = "cycleID")
    private Integer cycleID;

    @Column(name = "sentAt")
    private LocalDateTime sentAt;

    @Column(name = "channel")
    private String channel;

    @Column(name = "status")
    private String status;

    @Column(name = "message", columnDefinition = "nvarchar(max)")
    private String message;
}
