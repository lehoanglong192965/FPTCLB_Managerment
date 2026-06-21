package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventReport;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventReportRepository extends JpaRepository<EventReport, Integer> {
    boolean existsByEventIDAndIsDeletedFalse(Integer eventID);

    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends EventReport> S save(S entity);
}