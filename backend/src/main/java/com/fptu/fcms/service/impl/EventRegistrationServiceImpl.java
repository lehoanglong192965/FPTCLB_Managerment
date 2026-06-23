package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventRegistrationServiceImpl implements EventRegistrationService {

    private final EventRegistrationRepository registrationRepo;
    private final EventRepository eventRepository;
    private final ClubMembershipRepository membershipRepo;

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void registerEvent(Integer eventID, Integer userID) {
        Event event = eventRepository.findById(eventID)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));

        // [BR-D05] Kiểm tra điều kiện sinh viên phải là Active member nếu là sự kiện nội bộ
        if (event.getIsInternal() != null && event.getIsInternal()) {
            boolean isActiveMember = membershipRepo.existsByClubIDAndUserIDAndIsDeletedFalse(
                    event.getClubID(), userID
            );

            if (!isActiveMember) {
                throw new IllegalArgumentException("Bạn phải là thành viên của CLB để tham gia sự kiện nội bộ này.");
            }
        }

        if (registrationRepo.existsByEventIDAndUserIDAndIsDeletedFalse(eventID, userID)) {
            throw new IllegalArgumentException("Bạn đã đăng ký sự kiện này rồi.");
        }

        EventRegistration registration = new EventRegistration();
        registration.setEventID(eventID);
        registration.setUserID(userID);
        registration.setRegisteredAt(LocalDateTime.now());
        registration.setStatus("Registered");
        registration.setIsDeleted(false);

        registrationRepo.save(registration);
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void unregisterEvent(Integer eventID, Integer userID) {
        EventRegistration registration = registrationRepo.findByEventIDAndUserIDAndIsDeletedFalse(eventID, userID)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa đăng ký sự kiện này."));

        registration.setStatus("Cancelled");
        registration.setIsDeleted(true);
        registrationRepo.save(registration);
    }

    @Override
    public boolean isUserRegistered(Integer eventId, Integer userId) {
        return registrationRepo.existsByEventIDAndUserIDAndIsDeletedFalse(eventId, userId);
    }

    @Override
    public java.util.List<Event> getEventsByUserRegistered(Integer userId) {
        java.util.List<EventRegistration> registrations = registrationRepo.findByUserIDAndIsDeletedFalse(userId);
        return registrations.stream()
                .map(reg -> eventRepository.findById(reg.getEventID()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());
    }
}
