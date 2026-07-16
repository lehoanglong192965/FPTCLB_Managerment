package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * Lịch sử điều động nhân sự khẩn cấp do IC-PDP thực hiện
 * (thay thế Trưởng / Phó Trưởng CLB giữa kỳ do kỷ luật).
 *
 * Tên người liên quan được denormalize (lưu kèm) để lịch sử ổn định
 * kể cả khi user đổi tên hoặc bị xóa sau này.
 */
@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "PersonnelReassignLog")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PersonnelReassignLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "logID")
    private Integer logID;

    @Column(name = "clubID")
    private Integer clubID;

    @org.hibernate.annotations.Nationalized
    @Column(name = "clubName")
    private String clubName;

    /** "leader" hoặc "vice" */
    @Column(name = "position", length = 20)
    private String position;

    /** Mức độ vi phạm (ví dụ: "Cách chức", "Cảnh cáo"...) */
    @org.hibernate.annotations.Nationalized
    @Column(name = "level", length = 100)
    private String level;

    @Column(name = "fromUserID")
    private Integer fromUserID;

    @org.hibernate.annotations.Nationalized
    @Column(name = "fromName")
    private String fromName;

    @Column(name = "toUserID")
    private Integer toUserID;

    @org.hibernate.annotations.Nationalized
    @Column(name = "toName")
    private String toName;

    @org.hibernate.annotations.Nationalized
    @Column(name = "reason", columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @Column(name = "actorID")
    private Integer actorID;

    @org.hibernate.annotations.Nationalized
    @Column(name = "actorName")
    private String actorName;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (isDeleted == null) isDeleted = false;
    }
}