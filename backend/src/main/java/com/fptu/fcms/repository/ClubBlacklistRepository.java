package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
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
}