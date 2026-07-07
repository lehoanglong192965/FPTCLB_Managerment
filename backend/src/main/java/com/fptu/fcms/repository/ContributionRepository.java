package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContributionRepository extends JpaRepository<EventContribution, Integer> {
    List<EventContribution> findByEventIDAndIsDeletedFalse(Integer eventID);

    List<EventContribution> findByUserIDAndIsDeletedFalse(Integer userID);

    Optional<EventContribution> findByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);

    List<EventContribution> findByBatchIDAndIsDeletedFalse(Integer batchID);

    Optional<EventContribution> findByBatchIDAndUserIDAndIsDeletedFalse(Integer batchID, Integer userID);

    List<EventContribution> findByBatchIDAndUserIDInAndIsDeletedFalse(Integer batchID, Collection<Integer> userIDs);

    boolean existsByBatchIDAndUserIDAndIsDeletedFalse(Integer batchID, Integer userID);
}
