package com.fptu.fcms.repository;

import com.fptu.fcms.entity.DisciplineLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository cho DisciplineLog — truy cập bảng DisciplineLog.
 *
 * Phục vụ kiểm tra Business Rule BR-01:
 *   Không gán Leader cho sinh viên có án kỷ luật đang Active trong học kỳ hiện tại.
 *
 * ⚠️ LÝ DO DÙNG @Query THAY VÌ DERIVED METHOD:
 *   Entity DisciplineLog khai báo field là "userID" (chữ D hoa).
 *   Spring Data JPA parse tên method theo camelCase split — nó tìm property "userId"
 *   (chữ d thường), không khớp với "userID" trong entity → sinh ra lỗi:
 *     "No property 'userId' found for type 'DisciplineLog'"
 *   Giải pháp: viết @Query JPQL tường minh, tham chiếu đúng tên field của entity.
 */
@Repository
public interface DisciplineLogRepository extends JpaRepository<DisciplineLog, Integer> {

    /**
     * Kiểm tra sinh viên có án kỷ luật Active trong học kỳ chỉ định hay không.
     *
     * Tương đương SQL:
     *   SELECT COUNT(*) > 0 FROM DisciplineLog
     *   WHERE userID = ? AND semesterID = ? AND disciplineStatus = 'Active'
     *
     * Dùng @Query JPQL tường minh để tránh lỗi parse tên field "userID" / "semesterID"
     * (Spring Data JPA derived query không nhận diện đúng field viết hoa liền như ID).
     *
     * @param userId           ID sinh viên cần kiểm tra
     * @param semesterId       ID học kỳ cần kiểm tra
     * @param disciplineStatus trạng thái kỷ luật cần so sánh (truyền vào "Active")
     * @return true nếu sinh viên CÓ ít nhất 1 án kỷ luật Active → chặn gán Leader
     */
    @Query("SELECT COUNT(d) > 0 FROM DisciplineLog d " +
            "WHERE d.userID = :userId " +
            "AND d.semesterID = :semesterId " +
            "AND d.disciplineStatus = :disciplineStatus")
    boolean hasActiveDiscipline(
            @Param("userId") Integer userId,
            @Param("semesterId") Integer semesterId,
            @Param("disciplineStatus") String disciplineStatus
    );
}