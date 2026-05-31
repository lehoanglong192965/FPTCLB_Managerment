package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "EventRole")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "eventRoleID")
    private Integer eventRoleID;

    @Column(name = "roleName", nullable = false, unique = true, length = 50)
    private String roleName;

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default private Boolean isDeleted = false;
}
