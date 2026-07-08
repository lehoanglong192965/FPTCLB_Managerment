package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

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

    @Column(name = "userPrompt")
    private String userPrompt;

    @Column(name = "aiResponse")
    private String aiResponse;

    @Column(name = "intentMatched")
    private String intentMatched;

    @Column(name = "tokensUsed")
    private Integer tokensUsed;

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
