package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContributionRepository extends JpaRepository<Contribution, Integer> {
    List<Contribution> findByEventIDAndIsDeletedFalse(Integer eventID);

    List<Contribution> findByBatchIDAndIsDeletedFalse(Integer batchID);

    Optional<Contribution> findByBatchIDAndUserIDAndIsDeletedFalse(Integer batchID, Integer userID);

    List<Contribution> findByBatchIDAndUserIDInAndIsDeletedFalse(Integer batchID, Collection<Integer> userIDs);
}
