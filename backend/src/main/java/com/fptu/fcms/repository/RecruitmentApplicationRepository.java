package com.fptu.fcms.repository;

import com.fptu.fcms.entity.RecruitmentApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecruitmentApplicationRepository extends JpaRepository<RecruitmentApplication, Integer>
{

    // Kiểm tra xem sinh viên đã từng rút đơn khỏi CLB này trong kỳ này chưa (BR-R08)
    boolean existsByUserIDAndClubIDAndSemesterIDAndStatusAndIsDeletedFalse(
            Integer userID, Integer clubID, Integer semesterID, String status);

    // Đếm số lượng đơn đang Active của 1 User trong 1 Kỳ (BR-R01)
    long countByUserIDAndSemesterIDAndStatusInAndIsDeletedFalse(
            Integer userID, Integer semesterID, List<String> statuses);

    // Đếm số lượng đơn Pending và Interviewing của 1 User trong 1 Kỳ (phục vụ BR-R01)
    default int countPendingApplications(Integer userID, Integer semesterID) {
        return (int) countByUserIDAndSemesterIDAndStatusInAndIsDeletedFalse(
                userID, semesterID, java.util.List.of("Pending", "Interviewing")
        );
    }

    // Tìm các đơn bị bỏ nháp quá hạn để Auto-Cleanup (BR-R07)
    List<RecruitmentApplication> findByStatusAndIsDeletedFalseAndCreatedAtBefore(
            String status, java.time.LocalDateTime date);
}