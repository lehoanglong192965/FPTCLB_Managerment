package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho ClubRole — truy cập bảng ClubRole.
 *
 * ClubRole chứa các vai trò trong CLB: Leader (1), ViceLeader (2), Member (3).
 * Dùng để resolve tên vai trò thành ID khi xử lý bổ nhiệm/bãi nhiệm.
 */
@Repository
public interface ClubRoleRepository extends JpaRepository<ClubRole, Integer> {

    /**
     * Tìm ClubRole theo tên vai trò (Leader / ViceLeader / Member).
     *
     * Tương đương SQL:
     * SELECT * FROM ClubRole WHERE roleName = ? AND isDeleted = 0
     *
     * @param roleName tên vai trò cần tìm
     * @return Optional<ClubRole>
     */
    Optional<ClubRole> findByRoleNameAndIsDeletedFalse(String roleName);
}