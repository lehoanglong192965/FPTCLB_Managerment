package com.fptu.fcms.repository;

import com.fptu.fcms.entity.CompetitionAward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionAwardRepository extends JpaRepository<CompetitionAward, Integer> {
    List<CompetitionAward> findByCompetitionID(Integer competitionID);
}
