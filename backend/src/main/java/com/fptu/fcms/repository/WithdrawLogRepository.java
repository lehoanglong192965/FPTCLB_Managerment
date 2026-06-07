package com.fptu.fcms.repository;

import com.fptu.fcms.entity.WithdrawLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository thao tác với bảng WithdrawLog.
 *
 * Bảng này phục vụ 2 rule chính:
 * - Quota: tối đa 5 lần rút đơn / học kỳ.
 * - Cooldown: sau khi rút đơn khỏi 1 CLB, phải đợi 3 giờ mới được nộp lại.
 */
@Repository
public interface WithdrawLogRepository extends JpaRepository<WithdrawLog, Integer> {

    /**
     * Đếm số lần rút đơn của sinh viên trong một học kỳ.
     *
     * Dùng trong API withdraw:
     * - Nếu count >= 5 thì chặn rút đơn.
     *
     * @param userID ID sinh viên
     * @param semesterID ID học kỳ
     * @return số lần sinh viên đã rút đơn trong học kỳ
     */
    long countByUserIDAndSemesterID(Integer userID, Integer semesterID);

    /**
     * Lấy lần rút đơn gần nhất của sinh viên tại đúng CLB.
     *
     * Dùng trong API apply/create:
     * - Nếu thời gian hiện tại - withdrawnAt < 3 giờ thì chặn nộp lại.
     *
     * @param studentID ID sinh viên
     * @param clubID ID CLB
     * @return log rút đơn gần nhất nếu có
     */
    Optional<WithdrawLog> findTopByUserIDAndClubIDOrderByWithdrawnAtDesc(
            Integer studentID,
            Integer clubID
    );

    /**
     * Kiểm tra đơn này đã có log rút chưa.
     *
     * Dùng để chống spam/race condition:
     * - Một application chỉ được ghi WithdrawLog đúng 1 lần.
     *
     * @param applicationID ID đơn ứng tuyển
     * @return true nếu đã từng rút, false nếu chưa
     */
    boolean existsByApplicationID(Integer applicationID);
}