package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
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
    boolean existsByRegistrationIDAndAttendanceStatusAndIsDeletedFalse(Integer registrationID, AttendanceStatus attendanceStatus);

    Optional<AttendanceRecord> findBySessionIDAndGuestRegistrationID(Integer sessionID, Integer guestRegistrationID);
    boolean existsBySessionIDAndGuestRegistrationIDAndIsDeletedFalse(Integer sessionID, Integer guestRegistrationID);

    Optional<AttendanceRecord> findBySessionIDAndUserID(Integer sessionID, Integer userID);

    List<AttendanceRecord> findBySessionID(Integer sessionID);
    List<AttendanceRecord> findBySessionIDInAndIsDeletedFalse(Collection<Integer> sessionIDs);

    @CacheEvict(value = "memberRanking", allEntries = true)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE AttendanceRecord record
            SET record.attendanceStatus = :attendanceStatus,
                record.checkInMethod = :checkInMethod,
                record.verificationMethod = :verificationMethod,
                record.checkedInBy = :checkedInBy,
                record.checkedInAt = :checkedInAt,
                record.markedAt = :checkedInAt,
                record.updatedAt = :checkedInAt
            WHERE record.recordID = :recordId
              AND record.isDeleted = false
              AND (record.attendanceStatus IS NULL OR record.attendanceStatus <> :attendanceStatus)
            """)
    int markPresentWithQrTicketIfNotAlreadyCheckedIn(
            @Param("recordId") Integer recordId,
            @Param("attendanceStatus") AttendanceStatus attendanceStatus,
            @Param("checkInMethod") CheckInMethod checkInMethod,
            @Param("verificationMethod") String verificationMethod,
            @Param("checkedInBy") Integer checkedInBy,
            @Param("checkedInAt") LocalDateTime checkedInAt
    );
}