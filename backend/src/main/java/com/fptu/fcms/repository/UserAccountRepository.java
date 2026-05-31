package com.fptu.fcms.repository;

import com.fptu.fcms.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {

    Optional<UserAccount> findByUserIDAndIsDeletedFalse(Integer userID);

    /** Kiểm tra user có đúng roleID (ví dụ roleID=2 để xác nhận ICPDP) */
    boolean existsByUserIDAndRoleIDAndIsDeletedFalse(Integer userID, Integer roleID);
}
