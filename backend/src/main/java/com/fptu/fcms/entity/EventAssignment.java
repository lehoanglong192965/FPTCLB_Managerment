package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "EventAssignment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignmentID")
    private Integer assignmentID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "eventRoleID")
    private Integer eventRoleID;

    @Column(name = "assignedAt")
    private LocalDateTime assignedAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}
