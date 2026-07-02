package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventRoleRepository extends JpaRepository<EventRole, Integer> {
    Optional<EventRole> findByEventRoleIDAndIsDeletedFalse(Integer eventRoleID);

    Optional<EventRole> findByRoleNameAndIsDeletedFalse(String roleName);
}
