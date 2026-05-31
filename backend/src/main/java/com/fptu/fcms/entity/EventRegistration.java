package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "EventRegistration")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "eventID", nullable = false) private Integer eventID;
    @Column(name = "userID",  nullable = false) private Integer userID;

    @Column(name = "registeredAt", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime registeredAt = LocalDateTime.now();

    /** Registered | Cancelled */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default private String status = "Registered";
}
