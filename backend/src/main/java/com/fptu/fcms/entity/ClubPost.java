package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "ClubPost")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClubPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "postID")
    private Integer postID;

    @Column(name = "clubID", nullable = false)
    private Integer clubID;

    @Column(name = "createdBy", nullable = false)
    private Integer createdBy;

    @Nationalized
    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "createdAt", columnDefinition = "DATETIME2")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;
}
