package com.fptu.fcms.entity;

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

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

}
