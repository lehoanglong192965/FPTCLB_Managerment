package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClubRegistrationRepository extends JpaRepository<ClubRegistration, Integer> {
    List<ClubRegistration> findByCreatedByAndIsDeletedFalse(Integer createdBy);
    List<ClubRegistration> findByStatusAndIsDeletedFalse(String status);
    List<ClubRegistration> findByIsDeletedFalse();
}
