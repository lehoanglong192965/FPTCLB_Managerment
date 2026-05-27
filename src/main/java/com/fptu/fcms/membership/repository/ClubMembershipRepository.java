package com.fptu.fcms.membership.repository;

import com.fptu.fcms.entity.ClubMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubMembershipRepository extends JpaRepository<ClubMembership, Long> {

    /**
     * Counts active club memberships for a user in a specific semester.
     */
    @Query("SELECT COUNT(m) FROM ClubMembership m " +
           "WHERE m.user.userId = :userId " +
           "AND m.semester.semesterId = :semesterId " +
           "AND m.status = 'Active'")
    long countActiveClubs(@Param("userId") Long userId, @Param("semesterId") Long semesterId);
}
