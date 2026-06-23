package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Integer> {
    Optional<AttendanceRecord> findBySessionIDAndUserID(Integer sessionID, Integer userID);

    List<AttendanceRecord> findBySessionID(Integer sessionID);
}
