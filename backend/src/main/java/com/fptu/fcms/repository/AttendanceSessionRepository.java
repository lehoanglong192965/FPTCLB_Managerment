package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AttendanceSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Integer> {
    Optional<AttendanceSession> findByEventID(Integer eventID);
    Optional<AttendanceSession> findBySessionIDAndIsDeletedFalse(Integer sessionID);
    List<AttendanceSession> findByEventIDAndIsDeletedFalseOrderByCheckInTimeAsc(Integer eventID);
    boolean existsByEventIDAndIsDeletedFalse(Integer eventID);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AttendanceSession s WHERE s.eventID = :eventId AND s.isDeleted = false")
    Optional<AttendanceSession> findByEventIDForUpdate(@Param("eventId") Integer eventId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AttendanceSession s WHERE s.sessionID = :sessionId AND s.isDeleted = false")
    Optional<AttendanceSession> findBySessionIDForUpdate(@Param("sessionId") Integer sessionId);
}
