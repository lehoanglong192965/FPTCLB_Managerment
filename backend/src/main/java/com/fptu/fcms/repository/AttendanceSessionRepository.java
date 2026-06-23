package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Integer> {
    Optional<AttendanceSession> findByEventID(Integer eventID);
}
