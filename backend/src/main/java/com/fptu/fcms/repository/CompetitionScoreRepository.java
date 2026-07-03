package com.fptu.fcms.repository;

import com.fptu.fcms.entity.CompetitionScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionScoreRepository extends JpaRepository<CompetitionScore, Integer> {
    
    List<CompetitionScore> findByCompetitionIDOrderByTotalScoreDesc(Integer competitionID);

    @Modifying
    @Query("DELETE FROM CompetitionScore c WHERE c.competitionID = :competitionID")
    void deleteByCompetitionID(Integer competitionID);
}
