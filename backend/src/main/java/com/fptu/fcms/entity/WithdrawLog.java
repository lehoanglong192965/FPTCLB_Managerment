package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity lưu lịch sử rút đơn ứng tuyển.
 *
 * Bảng này dùng để:
 * - Tính số lần rút đơn trong 1 học kỳ.
 * - Kiểm tra cooldown 3 giờ khi sinh viên muốn nộp lại vào cùng CLB.
 * - Lưu audit/history để Admin có thể kiểm tra hành vi spam.
 */
@Entity
@Table(name = "WithdrawLog")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawLog {

    /**
     * Khóa chính tự tăng của bảng WithdrawLog.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "withdrawLogID")
    private Integer withdrawLogID;

    /**
     * ID của đơn ứng tuyển đã bị rút.
     * Dùng để chống ghi log rút trùng cho cùng một đơn.
     */
    @Column(name = "applicationID", nullable = false)
    private Integer applicationID;

    /**
     * ID sinh viên thực hiện rút đơn.
     */
    @Column(name = "studentID", nullable = false)
    private Integer studentID;

    /**
     * ID CLB mà sinh viên đã rút đơn.
     * Dùng để kiểm tra cooldown theo từng CLB.
     */
    @Column(name = "clubID", nullable = false)
    private Integer clubID;

    /**
     * ID học kỳ hiện tại.
     * Dùng để tính quota tối đa 5 lần rút / học kỳ.
     */
    @Column(name = "semesterID", nullable = false)
    private Integer semesterID;

    /**
     * Thời điểm sinh viên rút đơn.
     * Dùng để tính cooldown 3 giờ.
     */
    @Column(name = "withdrawnAt", nullable = false)
    private LocalDateTime withdrawnAt;
}