package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho ClubMembership — truy cập bảng ClubMembership.
 *
 * Các query phục vụ nghiệp vụ thay đổi Ban điều hành CLB (Bổ nhiệm/Bãi nhiệm Leader).
 */
@Repository
public interface ClubMembershipRepository extends JpaRepository<ClubMembership, Integer> {

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
    // KIỂM TRA LEADER TRONG NHIỀU CLB (Business Rule: 1 người chỉ làm Leader 1 CLB/kỳ)
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
     * Kiểm tra user đã làm Leader ở CLB KHÁC (không phải clubID hiện tại) trong học kỳ.
     * Cho phép re-assign Leader trong cùng CLB mà không bị chặn bởi rule trên.
     *
     * @param userID        ID user cần kiểm tra
     * @param semesterID    ID học kỳ
     * @param clubRoleID    ID vai trò (1 = Leader)
     * @param excludeClubID CLB đang xử lý — loại trừ khỏi kiểm tra
     * @return true nếu user đã là Leader ở CLB khác trong kỳ này
     */
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

    // =====================================================================
    // BR-A02: ĐẾM SỐ LEADER MEMBERSHIP CỦA USER TRONG HỌC KỲ
    // =====================================================================

    /**
     * BR-A02 — Đếm số lượng membership với vai trò Leader đang active của một user
     * trong một học kỳ cụ thể, trên TẤT CẢ các CLB.
     *
     * Dùng trong validateLeaderExclusive() để kiểm tra trước khi thêm mới hoặc
     * update role thành Leader. Nếu count > 0 → reject request.
     *
     * JPQL chú thích:
     *   - "m.isDeleted = false" tương đương WHERE isDeleted = 0
     *   - @SQLRestriction("isDeleted = false") trên entity cũng filter,
     *     nhưng viết tường minh để rõ intent và tránh bug nếu annotation bị bỏ
     *
     * SQL tương đương:
     *   SELECT COUNT(*) FROM ClubMembership
     *   WHERE userID = :userID AND semesterID = :semesterID
     *   AND clubRoleID = 1 AND isDeleted = 0
     *
     * @param userID     ID user cần kiểm tra
     * @param semesterID ID học kỳ cần kiểm tra
     * @param clubRoleID ID vai trò Leader (= 1 theo Seed Data)
     * @return số lượng membership Leader đang active (0 = chưa làm Leader ở đâu)
     */
    @Query("SELECT COUNT(m) FROM ClubMembership m " +
            "WHERE m.userID = :userID " +
            "AND m.semesterID = :semesterID " +
            "AND m.clubRoleID = :clubRoleID " +
            "AND m.isDeleted = false")
    long countLeaderMembershipByUserAndSemester(
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID,
            @Param("clubRoleID") Integer clubRoleID
    );

    /**
     * BR-A02 (variant) — Đếm Leader membership loại trừ CLB hiện tại.
     * Dùng khi UPDATE role trong CLB đang xử lý (tránh tự count chính mình).
     *
     * SQL tương đương:
     *   SELECT COUNT(*) FROM ClubMembership
     *   WHERE userID = :userID AND semesterID = :semesterID
     *   AND clubRoleID = 1 AND clubID != :excludeClubID AND isDeleted = 0
     *
     * @param userID        ID user cần kiểm tra
     * @param semesterID    ID học kỳ
     * @param clubRoleID    ID vai trò Leader (= 1)
     * @param excludeClubID CLB đang xử lý — không tính vào kết quả
     * @return số lượng Leader membership ở các CLB KHÁC
     */
    @Query("SELECT COUNT(m) FROM ClubMembership m " +
            "WHERE m.userID = :userID " +
            "AND m.semesterID = :semesterID " +
            "AND m.clubRoleID = :clubRoleID " +
            "AND m.clubID != :excludeClubID " +
            "AND m.isDeleted = false")
    long countLeaderMembershipByUserAndSemesterExcludingClub(
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID,
            @Param("clubRoleID") Integer clubRoleID,
            @Param("excludeClubID") Integer excludeClubID
    );
}