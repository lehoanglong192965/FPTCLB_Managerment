package com.fptu.fcms.repository;

import com.fptu.fcms.entity.CompetitionPenalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionPenaltyRepository extends JpaRepository<CompetitionPenalty, Integer> {
    List<CompetitionPenalty> findByCompetitionIDAndUserID(Integer competitionID, Integer userID);
}
