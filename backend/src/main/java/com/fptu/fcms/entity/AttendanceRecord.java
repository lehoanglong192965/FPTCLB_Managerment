package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "AttendanceRecord")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recordID")
    private Integer recordID;

    @Column(name = "sessionID", nullable = false) private Integer sessionID;
    @Column(name = "userID",    nullable = false) private Integer userID;

    /** Present | Absent | Late */
    @Column(name = "attendanceStatus", nullable = false, length = 20)
    @Builder.Default private String attendanceStatus = "Absent";

    @Column(name = "capturedImgUrl",    length = 500) private String capturedImgUrl;

    @Column(name = "aiMatchConfidence", precision = 5, scale = 2)
    private BigDecimal aiMatchConfidence;

    @Column(name = "isVerifiedByAI", nullable = false)
    @Builder.Default private Boolean isVerifiedByAI = false;

    @Column(name = "markedAt", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime markedAt = LocalDateTime.now();
}
