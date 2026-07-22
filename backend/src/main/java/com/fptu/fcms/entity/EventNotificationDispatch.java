package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "EventNotificationDispatch", uniqueConstraints = @UniqueConstraint(
        name = "UQ_EventNotificationDispatch", columnNames = {"eventID", "recipientKey", "notificationType"}))
@Getter @Setter @NoArgsConstructor
public class EventNotificationDispatch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispatchID")
    private Long dispatchID;
    @Column(name = "eventID", nullable = false)
    private Integer eventID;
    @Column(name = "recipientKey", nullable = false, length = 255)
    private String recipientKey;
    @Column(name = "notificationType", nullable = false, length = 50)
    private String notificationType;
    @Column(name = "sentAt", nullable = false)
    private LocalDateTime sentAt;
}
