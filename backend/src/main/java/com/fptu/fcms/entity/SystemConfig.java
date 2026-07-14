package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.Nationalized;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "SystemConfig")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "configID")
    private Integer configID;

    @Column(name = "configKey")
    private String configKey;

    @Nationalized
    @Column(name = "configValue", nullable = false, length = 500)
    private String configValue;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "updatedBy")
    private Integer updatedBy;

}

