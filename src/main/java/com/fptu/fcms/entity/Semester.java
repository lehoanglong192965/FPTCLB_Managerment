package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "semesters")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long semesterId;

    @Column(nullable = false, unique = true)
    private String semesterName;
}
