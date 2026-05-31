package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
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

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}
