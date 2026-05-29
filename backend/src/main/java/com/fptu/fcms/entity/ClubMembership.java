package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ClubMembership")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClubMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add fields mapping to SQLQuery2.sql
}
