package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Semester")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "semesterID")
    private Integer semesterID;

    /** SP26 | SU26 | FA26 */
    @Column(name = "semesterCode", nullable = false, unique = true, length = 10)
    private String semesterCode;

    @Column(name = "startDate", nullable = false)
    private LocalDate startDate;

    @Column(name = "endDate", nullable = false)
    private LocalDate endDate;

    /** true = học kỳ đang active (chỉ 1 kỳ tại một thời điểm) */
    @Column(name = "isActive", nullable = false)
    private Boolean isActive = false;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;
}
