package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "AttendanceSession")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sessionID")
    private Integer sessionID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "sessionName")
    private String sessionName;

    @Column(name = "checkInTime")
    private LocalDateTime checkInTime;

    @Column(name = "evidenceProofUrl")
    private String evidenceProofUrl;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}

