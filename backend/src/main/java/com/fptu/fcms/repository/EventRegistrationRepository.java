package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Integer> {
    boolean existsByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    Optional<EventRegistration> findByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
    java.util.List<EventRegistration> findByEventIDAndIsDeletedFalse(Integer eventID);
    java.util.List<EventRegistration> findByUserIDAndIsDeletedFalse(Integer userID);
    List<EventRegistration> findByEventIDInAndUserIDInAndStatusAndIsDeletedFalse(
            Collection<Integer> eventIDs,
            Collection<Integer> userIDs,
            String status
    );
}
