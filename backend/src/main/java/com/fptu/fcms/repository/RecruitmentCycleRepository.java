package com.fptu.fcms.repository;

import com.fptu.fcms.entity.RecruitmentCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecruitmentCycleRepository extends JpaRepository<RecruitmentCycle, Integer> {

    List<RecruitmentCycle> findByClubIDAndIsDeletedFalseOrderByCreatedAtDesc(Integer clubID);

    Optional<RecruitmentCycle> findFirstByClubIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            Integer clubID, String status
    );

    List<RecruitmentCycle> findByClubIDIsNullAndIsDeletedFalseOrderByCreatedAtDesc();

    List<RecruitmentCycle> findByParentCycleIDAndIsDeletedFalseOrderByCreatedAtDesc(Integer parentCycleID);

    Optional<RecruitmentCycle> findFirstByClubIDIsNullAndSemesterIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            Integer semesterID, String status
    );

    boolean existsByParentCycleIDAndClubIDAndIsDeletedFalse(Integer parentCycleID, Integer clubID);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM RecruitmentCycle c, RecruitmentCycle p " +
            "WHERE c.parentCycleID = p.cycleID " +
            "AND c.clubID = :clubId " +
            "AND c.status = 'Open' " +
            "AND c.isDeleted = false " +
            "AND c.startDate <= :date " +
            "AND (c.endDate IS NULL OR c.endDate >= :date) " +
            "AND p.clubID IS NULL " +
            "AND p.status = 'Open' " +
            "AND p.isDeleted = false " +
            "AND p.startDate <= :date " +
            "AND (p.endDate IS NULL OR p.endDate >= :date)")
    boolean isRecruitmentOpenForClub(
            @Param("clubId") Integer clubId,
            @Param("date") LocalDate date
    );

    @Query("SELECT c FROM RecruitmentCycle c " +
            "WHERE c.status = 'Open' " +
            "AND c.startDate <= :date " +
            "AND (c.reminded = false OR c.reminded IS NULL) " +
            "AND c.isDeleted = false")
    List<RecruitmentCycle> findOpenCyclesStartedBefore(@Param("date") LocalDate date);
}
