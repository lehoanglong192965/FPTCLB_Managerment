package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SystemRole")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roleID")
    private Integer roleID;

    /** Admin | ICPDP | Student */
    @Column(name = "roleName", nullable = false, unique = true, length = 30)
    private String roleName;

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;
}
