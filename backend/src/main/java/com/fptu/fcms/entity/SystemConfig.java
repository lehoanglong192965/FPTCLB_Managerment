package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SystemConfig")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "configID")
    private Integer configID;

    @Column(name = "configKey",   nullable = false, unique = true, length = 50)
    private String configKey;

    @Column(name = "configValue", nullable = false, length = 100)
    private String configValue;

    @Column(name = "updatedAt",   nullable = false)
    @Builder.Default private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "updatedBy")
    private Integer updatedBy;
}
