package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubBlacklistRepository
        extends JpaRepository<ClubBlacklist, Integer> {

    // Lấy blacklist theo CLB và chưa bị xóa mềm
    List<ClubBlacklist> findByClubIDAndIsDeletedFalse(
            Integer clubID
    );

    // Lấy mọi bản ghi blacklist còn hiệu lực của một user (khắp các CLB) —
    // dùng để cảnh báo người duyệt khi user này ứng tuyển sang CLB khác.
    List<ClubBlacklist> findByUserIDAndIsDeletedFalse(
            Integer userID
    );

    // Tìm blacklist theo ID
    Optional<ClubBlacklist>
    findByBlacklistIDAndIsDeletedFalse(
            Integer blacklistID
    );

    // Kiểm tra user đã nằm trong blacklist chưa
    boolean existsByClubIDAndUserIDAndIsDeletedFalse(
            Integer clubID,
            Integer userID
    );

    @Query("SELECT COUNT(b) > 0 FROM ClubBlacklist b, UserAccount u " +
            "WHERE b.userID = u.userID " +
            "AND u.studentId = :studentId " +
            "AND b.isDeleted = false " +
            "AND u.isDeleted = false")
    boolean existsByStudentId(
            @Param("studentId") String studentId
    );
}