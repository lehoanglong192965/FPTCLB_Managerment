package com.fptu.fcms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.Nationalized;
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

    @Nationalized
    @Column(name = "title", nullable = false, length = 200, columnDefinition = "NVARCHAR(200)")
    private String title;

    @Nationalized
    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @JsonIgnore
    @Column(name = "fileUrl", length = 500)
    private String fileUrl;

    @Column(name = "visibilityScope", nullable = false, length = 20)
    private String visibilityScope = "ClubInternal";

    @Column(name = "indexingStatus", nullable = false, length = 20)
    private String indexingStatus = "Pending";

    @Column(name = "sourceFormat", nullable = false, length = 10)
    private String sourceFormat = "MD";

    @Column(name = "uploadedBy")
    private Integer uploadedBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

    @PrePersist
    void prePersist() {
        if (visibilityScope == null) {
            visibilityScope = "ClubInternal";
        }
        if (indexingStatus == null) {
            indexingStatus = "Pending";
        }
        if (sourceFormat == null) {
            sourceFormat = "MD";
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

}
