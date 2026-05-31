package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AIChatAuditLog")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AIChatAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chatLogID")
    private Integer chatLogID;

    /** Nullable — cho phép anonymous user */
    @Column(name = "userID") private Integer userID;

    @Column(name = "userPrompt", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String userPrompt;

    @Column(name = "aiResponse", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String aiResponse;

    @Column(name = "intentMatched", length = 50)
    private String intentMatched;

    @Column(name = "tokensUsed", nullable = false)
    @Builder.Default private Integer tokensUsed = 0;

    @Column(name = "createdAt", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
