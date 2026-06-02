package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventRegistration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "registeredAt")
    private LocalDateTime registeredAt;

    @Column(name = "status")
    private String status;

}