package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "KnowledgeChunk")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeChunk {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chunkID")
    private Integer chunkID;

    @Column(name = "archiveID", nullable = false)
    private Integer archiveID;

    @Column(name = "chunkIndex", nullable = false)
    private Integer chunkIndex;

    @Column(name = "chunkText", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String chunkText;

    @Column(name = "embeddingVector", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String embeddingVector;

    @Column(name = "embeddingStoreId", length = 64)
    private String embeddingStoreId;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
