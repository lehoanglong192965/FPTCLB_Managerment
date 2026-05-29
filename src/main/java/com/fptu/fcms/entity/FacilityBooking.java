package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "FacilityBooking")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add fields mapping to SQLQuery2.sql
}
