package com.fptu.fcms.entity;

import org.hibernate.annotations.Nationalized;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "AIChatAuditLog")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AIChatAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chatLogID")
    private Integer chatLogID;

    @Column(name = "userID")
    private Integer userID;

    @Nationalized
    @Column(name = "userPrompt", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String userPrompt;

    @Nationalized
    @Column(name = "aiResponse", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String aiResponse;

    @Column(name = "intentMatched", length = 50)
    private String intentMatched;

    @Column(name = "tokensUsed", nullable = false)
    private int tokensUsed;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "Success";

    @Column(name = "citationsJson", columnDefinition = "NVARCHAR(MAX)")
    private String citationsJson;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (status == null) {
            status = "Success";
        }
    }

}
