package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventRegistrationPolicy;
import com.fptu.fcms.enums.ParticipantType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationPolicyRepository extends JpaRepository<EventRegistrationPolicy, Integer> {
    List<EventRegistrationPolicy> findByEventIDAndIsDeletedFalse(Integer eventID);

    Optional<EventRegistrationPolicy> findByEventIDAndParticipantTypeAndIsDeletedFalse(Integer eventID, ParticipantType participantType);

    boolean existsByEventIDAndParticipantTypeAndIsDeletedFalse(Integer eventID, ParticipantType participantType);
}
