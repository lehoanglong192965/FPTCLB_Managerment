package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubBlacklistRepository extends JpaRepository<ClubBlacklist, Integer> {

    boolean existsByClubIDAndUserIDAndIsDeletedFalse(Integer clubID, Integer userID);
}
