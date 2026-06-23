package com.fptu.fcms.repository;

import com.fptu.fcms.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserAccount, Integer> {

    // Spring Data JPA sẽ tự động hiểu hàm này tương đương với:
    // SELECT * FROM UserAccount WHERE email = ? AND isDeleted = 0
    Optional<UserAccount> findByEmailAndIsDeletedFalse(String email);

    Optional<UserAccount> findByStudentId(String studentId);

    Optional<UserAccount> findByStudentIdAndIsDeletedFalse(String studentId);

    Optional<UserAccount> findByUserIDAndIsDeletedFalse(Integer userID);
    List<UserAccount> findAllByUserIDIn(List<Integer> userIDs);
    List<UserAccount> findByRoleIDAndIsDeletedFalse(Integer roleID);
}
