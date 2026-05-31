package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AttendanceSession")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sessionID")
    private Integer sessionID;

    @Column(name = "eventID",     nullable = false) private Integer eventID;

    @Column(name = "sessionName", nullable = false, length = 100)
    private String sessionName;

    @Column(name = "checkInTime", nullable = false)
    private LocalDateTime checkInTime;

    @Column(name = "evidenceProofUrl", length = 500)
    private String evidenceProofUrl;

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default private Boolean isDeleted = false;
}
