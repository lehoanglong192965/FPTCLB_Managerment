package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "AttendanceRecord")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recordID")
    private Integer recordID;

    @Column(name = "sessionID")
    private Integer sessionID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "attendanceStatus")
    private String attendanceStatus;

    @Column(name = "capturedImgUrl")
    private String capturedImgUrl;

    @Column(name = "aiMatchConfidence")
    private BigDecimal aiMatchConfidence;

    @Column(name = "isVerifiedByAI")
    private Boolean isVerifiedByAI;

    @Column(name = "markedAt")
    private LocalDateTime markedAt;

}

