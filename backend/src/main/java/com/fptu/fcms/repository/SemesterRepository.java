package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho Semester — truy cập bảng Semester.
 *
 * Phục vụ lấy học kỳ đang Active để dùng làm ngữ cảnh
 * cho các thao tác thành viên CLB.
 */
@Repository
public interface SemesterRepository extends JpaRepository<Semester, Integer> {

    /**
     * Tìm học kỳ đang Active và chưa bị xóa mềm.
     *
     * Tương đương SQL:
     * SELECT TOP 1 * FROM Semester WHERE isActive = 1 AND isDeleted = 0
     *
     * DB Constraint UX_Semester_OneActive đảm bảo chỉ có 1 kỳ Active tại 1 thời điểm,
     * nên Optional luôn trả về 0 hoặc 1 kết quả.
     *
     * @return Optional<Semester> — rỗng nếu hệ thống chưa có kỳ Active nào
     */
    Optional<Semester> findByIsActiveTrueAndIsDeletedFalse();

    List<Semester> findByIsActiveTrue();

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Semester s " +
           "WHERE s.startDate <= :endDate AND s.endDate >= :startDate " +
           "AND (:excludeId IS NULL OR s.semesterID <> :excludeId)")
    boolean existsOverlappingSemester(@Param("startDate") LocalDate startDate, 
                                      @Param("endDate") LocalDate endDate, 
                                      @Param("excludeId") Integer excludeId);
}