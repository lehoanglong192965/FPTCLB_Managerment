package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "EventAssignment")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EventAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignmentID")
    private Integer assignmentID;

    @Column(name = "eventID",      nullable = false) private Integer eventID;
    @Column(name = "userID",       nullable = false) private Integer userID;
    @Column(name = "eventRoleID",  nullable = false) private Integer eventRoleID;

    @Column(name = "assignedAt", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime assignedAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default private Boolean isDeleted = false;
}
