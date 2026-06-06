package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
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

    @Column(name = "oldValue")
    private String oldValue;

    @Column(name = "newValue")
    private String newValue;

    @Column(name = "overrideReason")
    private String overrideReason;

    @Column(name = "executedAt")
    private LocalDateTime executedAt;

}
