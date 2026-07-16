package com.fptu.fcms.repository;

import com.fptu.fcms.entity.PersonnelReassignLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonnelReassignLogRepository extends JpaRepository<PersonnelReassignLog, Integer> {
    List<PersonnelReassignLog> findAllByOrderByCreatedAtDesc();
}