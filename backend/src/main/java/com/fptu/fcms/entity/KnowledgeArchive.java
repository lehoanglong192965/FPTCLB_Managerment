package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "KnowledgeArchive")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeArchive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "archiveID")
    private Integer archiveID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "title")
    private String title;

    @Column(name = "content")
    private String content;

    @Column(name = "fileUrl")
    private String fileUrl;

    @Column(name = "uploadedBy")
    private Integer uploadedBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}
