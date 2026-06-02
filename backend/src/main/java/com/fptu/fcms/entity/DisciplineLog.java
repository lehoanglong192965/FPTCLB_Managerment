package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "DisciplineLog")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DisciplineLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "disciplineID")
    private Integer disciplineID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Column(name = "reason")
    private String reason;

    @Column(name = "disciplineStatus")
    private String disciplineStatus;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

}
