package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "KnowledgeArchive")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class KnowledgeArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "archiveID")
    private Integer archiveID;

    @Column(name = "clubID",     nullable = false) private Integer clubID;
    @Column(name = "uploadedBy", nullable = false) private Integer uploadedBy;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content",  nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "fileUrl",  length = 500)
    private String fileUrl;

    @Column(name = "createdAt", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default private Boolean isDeleted = false;
}
