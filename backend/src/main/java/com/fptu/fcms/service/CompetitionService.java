package com.fptu.fcms.service;

import com.fptu.fcms.entity.Competition;

import java.util.List;
import java.util.Map;

public interface CompetitionService {
    List<Competition> getAllCompetitions();
    Competition getCompetitionById(Integer id);
    Competition createCompetition(Competition competition);
    Competition updateCompetition(Integer id, Competition updated);
    void approveCompetition(Integer id);
    void publishCompetition(Integer id);
    Map<String, Object> getCompetitionRanking(Integer competitionId);
    void calculateScores(Integer competitionId);
    void assignAwards(Integer competitionId);
}
