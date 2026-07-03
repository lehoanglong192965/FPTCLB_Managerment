package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ContributionAppeal;
import com.fptu.fcms.enums.AppealStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppealRepository extends JpaRepository<ContributionAppeal, Integer> {
    Optional<ContributionAppeal> findByAppealIDAndIsDeletedFalse(Integer appealID);

    List<ContributionAppeal> findByBatchIDAndIsDeletedFalse(Integer batchID);

    boolean existsByBatchIDAndStatusAndIsDeletedFalse(Integer batchID, AppealStatus status);

    boolean existsByBatchIDAndUserIDAndStatusAndIsDeletedFalse(Integer batchID, Integer userID, AppealStatus status);
}
