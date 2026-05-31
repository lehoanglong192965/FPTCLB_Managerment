package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Danh sách đen thành viên cấp CLB.
 * Khớp 100% với DDL bảng ClubBlacklist trong SQLQuery2.sql.
 *
 * Chặn sinh viên bị blacklist không cho đăng ký ứng tuyển vào CLB này.
 */
@Entity
@Table(
        name = "ClubBlacklist",
        uniqueConstraints = @UniqueConstraint(
                name = "UC_ClubBlacklist",
                columnNames = {"clubID", "userID"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubBlacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blacklistID")
    private Integer blacklistID;

    @Column(name = "clubID", nullable = false)
    private Integer clubID;

    @Column(name = "userID", nullable = false)
    private Integer userID;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "createdAt", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
}
