package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Nhật ký kỷ luật sinh viên.
 * disciplineStatus: Active | Expired
 *
 * [BR-L01] Nếu sinh viên có bản ghi disciplineStatus='Active'
 *          → KHÔNG được bổ nhiệm làm Leader / ViceLeader.
 */
@Entity
@Table(
    name = "DisciplineLog",
    indexes = @Index(name = "IX_DisciplineLog_User_Semester", columnList = "userID, semesterID")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisciplineLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "disciplineID")
    private Integer disciplineID;

    @Column(name = "userID", nullable = false)
    private Integer userID;

    @Column(name = "semesterID", nullable = false)
    private Integer semesterID;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    /** Active | Expired */
    @Column(name = "disciplineStatus", nullable = false, length = 20)
    private String disciplineStatus = "Active";

    @Column(name = "createdAt", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
