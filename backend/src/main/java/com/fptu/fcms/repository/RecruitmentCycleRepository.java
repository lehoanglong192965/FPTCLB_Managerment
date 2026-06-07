package com.fptu.fcms.repository;

import com.fptu.fcms.entity.RecruitmentCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecruitmentCycleRepository extends JpaRepository<RecruitmentCycle, Integer> {

    @Query("""
        SELECT c
        FROM RecruitmentCycle c
        WHERE c.status = 'Open'
        AND c.startDate <= :date
        AND (c.reminded = false OR c.reminded IS NULL)
        AND c.isDeleted = false
    """)
    List<RecruitmentCycle> findOpenCyclesStartedBefore(@Param("date") LocalDate date);
}
