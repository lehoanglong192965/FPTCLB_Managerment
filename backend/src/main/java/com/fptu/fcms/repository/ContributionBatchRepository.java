package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.enums.ContributionBatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContributionBatchRepository extends JpaRepository<ContributionBatch, Integer> {
    Optional<ContributionBatch> findByEventIDAndIsDeletedFalse(Integer eventID);

    Optional<ContributionBatch> findByBatchIDAndIsDeletedFalse(Integer batchID);

    List<ContributionBatch> findByClubIDAndStatusAndIsDeletedFalse(Integer clubID, ContributionBatchStatus status);
}
