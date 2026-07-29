package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "OTPVerification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OTPVerification {

    /** Số lần nhập sai tối đa trước khi mã bị khoá; muốn thử tiếp phải yêu cầu mã mới. */
    public static final int MAX_ATTEMPTS = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "otpID")
    private Integer otpID;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "otpCode", nullable = false, length = 6)
    private String otpCode;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expiresAt", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "isUsed", nullable = false)
    private Boolean isUsed;

    @Column(name = "attempts")
    private Integer attempts;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    public boolean isLocked() {
        return this.attempts != null && this.attempts >= MAX_ATTEMPTS;
    }

    public boolean isValid() {
        return !this.isUsed && !this.isExpired() && !this.isLocked();
    }
}

