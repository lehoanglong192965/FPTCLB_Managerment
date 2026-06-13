package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubRepository extends JpaRepository<Club, Integer> {
    
    @Query("SELECT c.clubID FROM Club c LEFT JOIN ClubMembership m ON c.clubID = m.clubID " +
           "AND m.semesterID = :semesterID AND m.isDeleted = false " +
           "WHERE c.clubStatus = 'Active' " +
           "GROUP BY c.clubID HAVING COUNT(m.membershipID) < 5")
    List<Integer> findClubsToDeactivate(@Param("semesterID") Integer semesterID);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Club c SET c.clubStatus = 'Inactive' WHERE c.clubID IN :clubIDs")
    void updateStatusToInactive(@Param("clubIDs") List<Integer> clubIDs);

    boolean existsByClubCode(String clubCode);
    boolean existsByClubName(String clubName);
}
