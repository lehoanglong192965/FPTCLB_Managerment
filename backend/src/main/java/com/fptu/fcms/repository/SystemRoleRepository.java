package com.fptu.fcms.repository;

import com.fptu.fcms.entity.SystemRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemRoleRepository extends JpaRepository<SystemRole, Integer> {

    // Spring Data JPA sẽ tự động hiểu hàm này tương đương câu lệnh SQL:
    // SELECT * FROM SystemRole WHERE roleName = ?
    Optional<SystemRole> findByRoleName(String roleName);
}