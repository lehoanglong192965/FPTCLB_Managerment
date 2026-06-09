package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "AllowedEmailWhitelist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("isDeleted = false")
public class AllowedEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "whitelistID")
    private Integer whitelistID;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "addedAt", nullable = false, updatable = false)
    private LocalDateTime addedAt;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted;

    @PrePersist
    protected void onCreate() {
        if (addedAt == null) {
            addedAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
