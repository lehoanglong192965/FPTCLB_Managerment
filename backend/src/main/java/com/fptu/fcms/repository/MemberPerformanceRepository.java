package com.fptu.fcms.repository;

import com.fptu.fcms.entity.MemberPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberPerformanceRepository extends JpaRepository<MemberPerformance, Integer> {
    @Query("SELECT mp.userID, COALESCE(SUM(mp.finalPoints), 0), COALESCE(SUM(mp.bonusPoints), 0) " +
            "FROM MemberPerformance mp " +
            "WHERE mp.clubID = :clubID " +
            "AND mp.isDeleted = false " +
            "GROUP BY mp.userID")
    List<Object[]> summarizeMemberPointsByClubID(@Param("clubID") Integer clubID);
}
