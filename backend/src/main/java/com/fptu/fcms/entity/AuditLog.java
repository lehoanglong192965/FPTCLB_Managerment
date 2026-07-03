package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "AuditLog")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "logID")
    private Integer logID;

    @Column(name = "actorID")
    private Integer actorID;

    @Column(name = "actionType")
    private String actionType;

    @Column(name = "tableName")
    private String tableName;

    @Column(name = "recordID")
    private Integer recordID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "attendanceRecordID")
    private Integer attendanceRecordID;

    @Column(name = "oldValue")
    private String oldValue;

    @Column(name = "newValue")
    private String newValue;

    @Column(name = "overrideReason")
    private String overrideReason;

    @Column(name = "beforeJson", columnDefinition = "NVARCHAR(MAX)")
    private String beforeJson;

    @Column(name = "afterJson", columnDefinition = "NVARCHAR(MAX)")
    private String afterJson;

    @Column(name = "reason", columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @Column(name = "requestId", length = 80)
    private String requestId;

    @Column(name = "executedAt")
    private LocalDateTime executedAt;

}
