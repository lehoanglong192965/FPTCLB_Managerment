package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import io.swagger.v3.oas.annotations.info.Contact;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "UserAccount")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userID")
    private Integer userID;

    @Column(name = "roleID")
    private Integer roleID;

    @Column(name = "email")
    private String email;

    // Bắt buộc phải có để đối chiếu mật khẩu lúc Login
//    @Transient//@Transient = chỉ tồn tại trong Java, Hibernate hoàn toàn bỏ qua
    @Column(name = "password")
    private String password;

    @org.hibernate.annotations.Nationalized
    @Column(name = "fullName")
    private String fullName;

    @Column(name = "studentId", length = 20)
    private String studentId;

    @Column(name = "phoneNumber", length = 20)
    private String phoneNumber;

    @org.hibernate.annotations.Nationalized
    @Column(name = "major", length = 100)
    private String major;

    @Column(name = "accountStatus")
    private String accountStatus;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;



}