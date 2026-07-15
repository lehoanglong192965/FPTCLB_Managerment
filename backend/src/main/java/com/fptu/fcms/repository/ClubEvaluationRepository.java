package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubEvaluationRepository extends JpaRepository<ClubEvaluation, Integer> {
    Optional<ClubEvaluation> findByEvaluationIDAndClubIDAndIsDeletedFalse(Integer evaluationID, Integer clubID);

    Optional<ClubEvaluation> findTopByClubIDAndSemesterIDAndIsDeletedFalseOrderByEvaluatedAtDescEvaluationIDDesc(
            Integer clubID,
            Integer semesterID
    );

    List<ClubEvaluation> findByClubIDAndIsDeletedFalseOrderByEvaluatedAtDescEvaluationIDDesc(Integer clubID);

    List<ClubEvaluation> findByClubIDAndSemesterIDAndIsDeletedFalseOrderByEvaluatedAtDescEvaluationIDDesc(
            Integer clubID,
            Integer semesterID
    );
}
