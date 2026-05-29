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

    // Tìm các đơn bị bỏ nháp quá hạn để Auto-Cleanup (BR-R07)
    List<RecruitmentApplication> findByStatusAndIsDeletedFalseAndCreatedAtBefore(
            String status, java.time.LocalDateTime date);
}