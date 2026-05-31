package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Integer> {

    /** Lấy học kỳ đang active (isActive=1, isDeleted=0) — unique toàn hệ thống */
    Optional<Semester> findByIsActiveTrueAndIsDeletedFalse();
}
