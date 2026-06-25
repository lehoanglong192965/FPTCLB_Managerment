package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventCapacityService;
import com.fptu.fcms.service.EventRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventRegistrationServiceImpl implements EventRegistrationService {

    private static final String REGISTRATION_STATUS_REGISTERED = "REGISTERED";

    private final EventRegistrationRepository registrationRepo;
    private final EventRepository eventRepository;
    private final ClubMembershipRepository membershipRepo;
    private final EventCapacityService eventCapacityService;

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void registerEvent(Integer eventID, Integer userID) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventID)
                .orElseThrow(() -> new IllegalArgumentException("Su kien khong ton tai."));

        if (!"RegistrationOpen".equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Su kien hien khong mo dang ky.");
        }

        if (event.getIsInternal() != null && event.getIsInternal()) {
            boolean isActiveMember = membershipRepo.existsByClubIDAndUserIDAndIsDeletedFalse(
                    event.getClubID(), userID
            );
            if (!isActiveMember) {
                throw new IllegalArgumentException("Ban phai la thanh vien cua CLB de tham gia su kien noi bo nay.");
            }
        }

        if (registrationRepo.existsByEventIDAndUserIDAndIsDeletedFalse(eventID, userID)) {
            throw new IllegalArgumentException("Ban da dang ky su kien nay roi.");
        }

        if (!eventCapacityService.reserveSeat(eventID, event.getMaxParticipants())) {
            throw new IllegalArgumentException("Su kien da het cho.");
        }

        try {
            EventRegistration registration = new EventRegistration();
            registration.setEventID(eventID);
            registration.setUserID(userID);
            registration.setGuestFullName(null);
            registration.setGuestEmail(null);
            registration.setGuestPhone(null);
            registration.setRegisteredAt(LocalDateTime.now());
            registration.setStatus(REGISTRATION_STATUS_REGISTERED);
            registration.setIsDeleted(false);
            registrationRepo.save(registration);
        } catch (RuntimeException ex) {
            eventCapacityService.releaseSeat(eventID);
            throw ex;
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void unregisterEvent(Integer eventID, Integer userID) {
        EventRegistration registration = registrationRepo.findByEventIDAndUserIDAndIsDeletedFalse(eventID, userID)
                .orElseThrow(() -> new IllegalArgumentException("Ban chua dang ky su kien nay."));

        registration.setStatus("Cancelled");
        registration.setIsDeleted(true);
        registrationRepo.save(registration);
        eventCapacityService.releaseSeat(eventID);
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void registerGuestEvent(Integer eventID, EventGuestRegistrationRequest request) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventID)
                .orElseThrow(() -> new IllegalArgumentException("Su kien khong ton tai."));

        if (!"RegistrationOpen".equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Su kien hien khong mo dang ky.");
        }

        if (request == null || request.getEmail() == null || request.getPhone() == null || request.getFullName() == null) {
            throw new IllegalArgumentException("Guest information is required.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (registrationRepo.existsByEventIDAndGuestEmailAndIsDeletedFalse(eventID, normalizedEmail)) {
            throw new IllegalArgumentException("Guest email already registered for this event.");
        }

        if (!eventCapacityService.reserveSeat(eventID, event.getMaxParticipants())) {
            throw new IllegalArgumentException("Su kien da het cho.");
        }

        try {
            EventRegistration registration = new EventRegistration();
            registration.setEventID(eventID);
            registration.setUserID(null);
            registration.setGuestFullName(request.getFullName().trim());
            registration.setGuestEmail(normalizedEmail);
            registration.setGuestPhone(request.getPhone().trim());
            registration.setRegisteredAt(LocalDateTime.now());
            registration.setStatus(REGISTRATION_STATUS_REGISTERED);
            registration.setIsDeleted(false);
            registrationRepo.save(registration);
        } catch (RuntimeException ex) {
            eventCapacityService.releaseSeat(eventID);
            throw ex;
        }
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
