package com.fptu.fcms.membership.repository;

import com.fptu.fcms.entity.RecruitmentApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RecruitmentApplicationRepository extends JpaRepository<RecruitmentApplication, Long> {

    /**
     * Counts the number of applications in pending states (Submitted, UnderReview)
     * for a given user in a specific semester.
     */
    @Query("SELECT COUNT(r) FROM RecruitmentApplication r " +
           "WHERE r.user.userId = :userId " +
           "AND r.semester.semesterId = :semesterId " +
           "AND r.status IN ('Submitted', 'UnderReview')")
    long countPendingApplications(@Param("userId") Long userId, @Param("semesterId") Long semesterId);
}
