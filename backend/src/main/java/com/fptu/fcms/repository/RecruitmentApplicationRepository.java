package com.fptu.fcms.repository;

import com.fptu.fcms.entity.RecruitmentApplication;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository xử lý đơn ứng tuyển CLB.
 *
 * File này có các hàm quan trọng để:
 * - Lock đơn khi rút.
 * - Chặn trùng đơn active.
 * - Đếm đơn đang pending.
 * - Quét đơn Draft quá hạn.
 */
@Repository
public interface RecruitmentApplicationRepository extends JpaRepository<RecruitmentApplication, Integer> {

    /**
     * Tìm đơn ứng tuyển theo ID và khóa dòng DB bằng PESSIMISTIC_WRITE.
     *
     * Công dụng:
     * - Chống nhiều request rút cùng một đơn trong cùng thời điểm.
     * - Request đầu tiên lock được dòng.
     * - Request sau phải chờ.
     * - Khi request sau đọc lại thì status đã là Withdrawn nên bị chặn.
     *
     * Không dùng findById() thường cho nghiệp vụ withdraw vì findById() không khóa dòng.
     *
     * @param applicationID ID đơn ứng tuyển
     * @return đơn ứng tuyển nếu tồn tại và chưa bị xóa mềm
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r
        FROM RecruitmentApplication r
        WHERE r.applicationID = :applicationID
        AND r.isDeleted = false
    """)
    Optional<RecruitmentApplication> findByIdForUpdate(
            @Param("applicationID") Integer applicationID
    );

    /**
     * Đếm số đơn blocking của sinh viên tại một CLB trong một học kỳ.
     *
     * Blocking status gồm:
     * - Submitted
     * - Reviewing
     * - Interviewing
     * - Approved
     * - Rejected
     *
     * Công dụng:
     * - Chặn sinh viên tạo đơn mới nếu đã có đơn đang hoạt động
     *   hoặc đã có kết quả tại CLB đó.
     *
     * Không tính:
     * - Draft
     * - Withdrawn
     *
     * @param userID ID sinh viên
     * @param clubID ID CLB
     * @param semesterID ID học kỳ
     * @return số đơn blocking
     */
    @Query("""
        SELECT COUNT(r)
        FROM RecruitmentApplication r
        WHERE r.userID = :userID
        AND r.clubID = :clubID
        AND r.semesterID = :semesterID
        AND r.isDeleted = false
        AND r.status IN ('Submitted', 'Reviewing', 'Interviewing', 'Approved', 'Rejected')
    """)
    long countBlockingApplications(
            @Param("userID") Integer userID,
            @Param("clubID") Integer clubID,
            @Param("semesterID") Integer semesterID
    );

    /**
     * Đếm số đơn đang trong quá trình xử lý của sinh viên trong học kỳ.
     *
     * Pending status gồm:
     * - Submitted
     * - Reviewing
     * - Interviewing
     *
     * Công dụng:
     * - Dùng để kiểm tra giới hạn tổng số CLB/đơn đang tham gia.
     *
     * @param userID ID sinh viên
     * @param semesterID ID học kỳ
     * @return số đơn đang pending
     */
    @Query("""
        SELECT COUNT(r)
        FROM RecruitmentApplication r
        WHERE r.userID = :userID
        AND r.semesterID = :semesterID
        AND r.isDeleted = false
        AND r.status IN ('Submitted', 'Reviewing', 'Interviewing')
    """)
    int countPendingApplications(
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID
    );

    /**
     * Tìm các đơn Draft chưa xóa và được tạo trước một mốc thời gian.
     *
     * Công dụng:
     * - Dùng cho Scheduler quét xóa mềm đơn Draft quá hạn 7 ngày.
     *
     * @param status thường truyền "Draft"
     * @param date mốc thời gian quá hạn
     * @return danh sách đơn Draft quá hạn
     */
    List<RecruitmentApplication> findByStatusAndIsDeletedFalseAndCreatedAtBefore(
            String status,
            LocalDateTime date
    );
}