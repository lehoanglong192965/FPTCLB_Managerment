package com.fptu.fcms.repository;
import java.util.List;

import com.fptu.fcms.entity.ClubMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho ClubMembership — truy cập bảng ClubMembership.
 *
 * Các query phục vụ nghiệp vụ thay đổi Ban điều hành CLB (Bổ nhiệm/Bãi nhiệm Leader).
 */
@Repository
public interface ClubMembershipRepository extends JpaRepository<ClubMembership, Integer> {
    List<ClubMembership> findByUserIDAndClubRoleIDAndIsDeletedFalse(
            Integer userID,
            Integer clubRoleID
    );

    // =====================================================================
    // TRUY VẤN THÀNH VIÊN THEO CLB & HỌC KỲ
    // =====================================================================

    /**
     * Tìm một membership đang active của một user trong một CLB tại một học kỳ cụ thể.
     * Dùng để kiểm tra user đã là thành viên chưa trước khi thực hiện bổ nhiệm.
     *
     * @param clubID     ID của CLB
     * @param userID     ID của user cần kiểm tra
     * @param semesterID ID học kỳ hiện tại
     * @return Optional<ClubMembership> — rỗng nếu chưa là thành viên
     */
    Optional<ClubMembership> findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
            Integer clubID, Integer userID, Integer semesterID
    );

    // =====================================================================
    // TRUY VẤN LEADER HIỆN TẠI CỦA CLB
    // =====================================================================

    /**
     * Tìm Leader hiện tại của một CLB trong một học kỳ.
     * clubRoleID = 1 → Leader (theo Seed Data trong SQL).
     * Dùng để bãi nhiệm Leader cũ trước khi bổ nhiệm Leader mới.
     *
     * @param clubID     ID của CLB
     * @param semesterID ID học kỳ
     * @param clubRoleID ID vai trò (1 = Leader)
     * @return Optional<ClubMembership> — rỗng nếu CLB chưa có Leader
     */
    Optional<ClubMembership> findByClubIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
            Integer clubID, Integer semesterID, Integer clubRoleID
    );

    // =====================================================================
    // TRUY VẤN DANH SÁCH BAN ĐIỀU HÀNH CLB
    // =====================================================================

    /**
     * Lấy danh sách Ban điều hành (Leader = 1, ViceLeader = 2) đang active.
     * Dùng cho endpoint GET danh sách ban điều hành.
     *
     * @param clubID     ID của CLB
     * @param semesterID ID học kỳ
     * @return List<ClubMembership> — danh sách Ban điều hành active
     */
    @Query("SELECT m FROM ClubMembership m " +
            "WHERE m.clubID = :clubID " +
            "AND m.semesterID = :semesterID " +
            "AND m.clubRoleID IN (1, 2) " +
            "AND m.isDeleted = false")
    List<ClubMembership> findBoardMembers(
            @Param("clubID") Integer clubID,
            @Param("semesterID") Integer semesterID
    );

    // =====================================================================
    // NOTE BR-A02:
    // KIỂM TRA LEADER TRONG NHIỀU CLB
    // Business Rule: 1 sinh viên chỉ được làm Leader tối đa 1 CLB trong cùng học kỳ.
    // =====================================================================

    /**
     * Kiểm tra user đã làm Leader ở bất kỳ CLB nào trong học kỳ chưa.
     * Business Rule từ DB constraint: UX_Membership_LeaderExclusive.
     * Kiểm tra ở tầng service để throw lỗi rõ ràng thay vì để DB exception.
     *
     * @param userID     ID user cần kiểm tra
     * @param semesterID ID học kỳ
     * @param clubRoleID ID vai trò (1 = Leader)
     * @return true nếu user đã là Leader ở CLB khác trong kỳ này
     */
    boolean existsByUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
            Integer userID, Integer semesterID, Integer clubRoleID
    );

    // =====================================================================
    // TRUY VẤN NÂNG CAO: KIỂM TRA LEADER Ở CLB KHÁC (loại trừ CLB hiện tại)
    // =====================================================================

    /**
     * NOTE BR-A02:
     * Kiểm tra user đã làm Leader ở CLB KHÁC (không phải clubID hiện tại) trong học kỳ.
     *
     * Vì sao phải loại trừ excludeClubID?
     * - Nếu user đang là Leader của chính CLB hiện tại và ta cập nhật lại role Leader,
     *   hệ thống không nên hiểu nhầm là vi phạm.
     * - Chỉ chặn khi user là Leader ở CLB khác.
     *
     * Cho phép re-assign Leader trong cùng CLB mà không bị chặn bởi rule trên.
     *
     * @param userID       ID user cần kiểm tra
     * @param semesterID   ID học kỳ
     * @param clubRoleID   ID vai trò (1 = Leader)
     * @param excludeClubID CLB đang xử lý — loại trừ khỏi kiểm tra
     * @return true nếu user đã là Leader ở CLB khác trong kỳ này
     */
    // NOTE BR-A02:
    // Query trả về true nếu tồn tại ít nhất 1 membership Leader active ở CLB khác.
    // isDeleted = false nghĩa là chỉ tính membership còn hiệu lực, không tính bản ghi đã xóa mềm.
    @Query("SELECT COUNT(m) > 0 FROM ClubMembership m " +
            "WHERE m.userID = :userID " +
            "AND m.semesterID = :semesterID " +
            "AND m.clubRoleID = :clubRoleID " +
            "AND m.clubID != :excludeClubID " +
            "AND m.isDeleted = false")
    boolean existsLeaderInOtherClub(
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID,
            @Param("clubRoleID") Integer clubRoleID,
            @Param("excludeClubID") Integer excludeClubID
    );
    // =========================================================
// [BR-R01]
// Đếm số CLB mà sinh viên đang tham gia trong học kỳ
// =========================================================
    /*
     * Dùng để:
     * - Check giới hạn tối đa số CLB/đơn ứng tuyển.
     */
    int countByUserIDAndSemesterIDAndIsDeletedFalse(
            Integer userID,
            Integer semesterID
    );
    List<ClubMembership> findByUserIDAndSemesterIDAndIsDeletedFalse(
            Integer userID,
            Integer semesterID
    );

    boolean existsByClubIDAndUserIDAndIsDeletedFalse(
            Integer clubID,
            Integer userID
    );
    @Query("""
            SELECT COUNT(m) > 0
            FROM ClubMembership m
            JOIN ClubRole r ON r.clubRoleID = m.clubRoleID
            WHERE m.clubID = :clubID
              AND m.userID = :userID
              AND m.isDeleted = false
              AND r.isDeleted = false
              AND r.roleName IN :roleNames
            """)
    boolean existsActiveMembershipByClubUserAndRoleNames(
            @Param("clubID") Integer clubID,
            @Param("userID") Integer userID,
            @Param("roleNames") java.util.Collection<String> roleNames
    );

    int countByClubIDAndIsDeletedFalse(Integer clubID);

    @Query("SELECT COUNT(m) > 0 FROM ClubMembership m, UserAccount u " +
            "WHERE m.userID = u.userID " +
            "AND u.studentId = :studentId " +
            "AND m.isDeleted = false " +
            "AND u.isDeleted = false")
    boolean existsByStudentIdAndIsDeletedFalse(
            @Param("studentId") String studentId
    );

    // Tìm tất cả membership mà user đang là Leader trong học kỳ
    // Dùng khi Admin/ICPDP kỷ luật Active để hạ Leader xuống Member
    @Query("SELECT m FROM ClubMembership m " +
            "WHERE m.userID = :userID " +
            "AND m.semesterID = :semesterID " +
            "AND m.clubRoleID = :clubRoleID " +
            "AND m.isDeleted = false")
    List<ClubMembership> findActiveLeaderMembershipsByUserAndSemester(
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID,
            @Param("clubRoleID") Integer clubRoleID
    );

    // Check user hiện tại có còn là Leader thật trong DB không
    // Nếu đã bị hạ xuống Member thì quyền Leader sẽ mất ngay
    boolean existsByClubIDAndUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
            Integer clubID,
            Integer userID,
            Integer semesterID,
            Integer clubRoleID
    );

    List<ClubMembership> findByClubIDAndSemesterIDAndIsDeletedFalse(
            Integer clubID,
            Integer semesterID
    );

    List<ClubMembership> findByClubIDAndClubRoleIDInAndIsDeletedFalse(
            Integer clubID,
            java.util.Collection<Integer> clubRoleIDs
    );
    List<ClubMembership> findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
            Integer clubID,
            Integer semesterID,
            java.util.Collection<Integer> clubRoleIDs
    );
    @Query("SELECT COUNT(m) > 0 FROM ClubMembership m, UserAccount u " +
            "WHERE m.userID = u.userID " +
            "AND m.clubID = :clubID " +
            "AND m.userID = :userID " +
            "AND m.semesterID = :semesterID " +
            "AND m.clubRoleID = :clubRoleID " +
            "AND m.isDeleted = false " +
            "AND u.isDeleted = false " +
            "AND u.accountStatus = 'Active'")
    boolean existsActiveLeaderInClub(
            @Param("clubID") Integer clubID,
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID,
            @Param("clubRoleID") Integer clubRoleID
    );

    @Query("SELECT DISTINCT m.userID FROM ClubMembership m, UserAccount u " +
            "WHERE m.userID = u.userID " +
            "AND m.clubID = :clubID " +
            "AND m.semesterID = :semesterID " +
            "AND m.isDeleted = false " +
            "AND u.isDeleted = false " +
            "AND u.accountStatus = 'Active'")
    List<Integer> findActiveRecipientUserIdsByClubId(
            @Param("clubID") Integer clubID,
            @Param("semesterID") Integer semesterID
    );
}
