package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "SchedulerLog", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"jobName", "executionDate"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SchedulerLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "logID")
    private Integer logID;

    @Column(name = "jobName", nullable = false)
    private String jobName;

    @Column(name = "executionDate", nullable = false)
    private LocalDate executionDate;

    @Column(name = "executedAt", nullable = false)
    private LocalDateTime executedAt;

    @Column(name = "status", nullable = false)
    private String status;
}
