package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "Club")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Club {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "clubCode")
    private String clubCode;

    @Column(name = "clubName")
    private String clubName;

    @Column(name = "description")
    private String description;

    @Column(name = "applicationFormQuestions")
    private String applicationFormQuestions;

    @Column(name = "clubStatus")
    private String clubStatus;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

    // =========================================================
    // [NEW]
    // Trạng thái hoạt động của CLB
    // =========================================================
    /*
     * Active:
     * - CLB đang hoạt động bình thường.
     *
     * Inactive:
     * - CLB bị vô hiệu hóa/tạm khóa.
     * - Scheduler có thể tự động chuyển sang trạng thái này.
     */
    @Column(name = "clubStatus")
    private String clubStatus;

}
