package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AttendanceRecord;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Integer> {
    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends AttendanceRecord> S save(S entity);

    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends AttendanceRecord> List<S> saveAll(Iterable<S> entities);

    Optional<AttendanceRecord> findBySessionIDAndRegistrationID(Integer sessionID, Integer registrationID);
    boolean existsBySessionIDAndRegistrationIDAndIsDeletedFalse(Integer sessionID, Integer registrationID);

    Optional<AttendanceRecord> findBySessionIDAndGuestRegistrationID(Integer sessionID, Integer guestRegistrationID);
    boolean existsBySessionIDAndGuestRegistrationIDAndIsDeletedFalse(Integer sessionID, Integer guestRegistrationID);

    Optional<AttendanceRecord> findBySessionIDAndUserID(Integer sessionID, Integer userID);

    List<AttendanceRecord> findBySessionID(Integer sessionID);
}