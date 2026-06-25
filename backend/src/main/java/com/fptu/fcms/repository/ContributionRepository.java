package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContributionRepository extends JpaRepository<Contribution, Integer> {
    List<Contribution> findByEventIDAndIsDeletedFalse(Integer eventID);
}
