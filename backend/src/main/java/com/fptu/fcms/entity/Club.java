package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Club")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clubID")
    private Integer clubID;

    /** Ví dụ: F-Code, JS, EVILA */
    @Column(name = "clubCode", nullable = false, unique = true, length = 20)
    private String clubCode;

    @Column(name = "clubName", nullable = false, length = 100)
    private String clubName;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    /** Cấu trúc câu hỏi động dạng JSON cho form tuyển dụng */
    @Column(name = "applicationFormQuestions", columnDefinition = "NVARCHAR(MAX)")
    private String applicationFormQuestions;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;
}
