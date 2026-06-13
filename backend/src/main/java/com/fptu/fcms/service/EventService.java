package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.EventDto;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.SemesterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final SemesterRepository semesterRepository;

    public EventService(EventRepository eventRepository, SemesterRepository semesterRepository) {
        this.eventRepository = eventRepository;
        this.semesterRepository = semesterRepository;
    }

    @Transactional(readOnly = true)
    public List<EventDto> getEventsByClubId(Integer clubId) {
        return eventRepository.findByClubIDAndIsDeletedFalse(clubId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EventDto createEvent(Integer clubId, EventDto request) {
        Semester activeSemester = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new IllegalStateException("Không có học kỳ nào đang Active"));

        Event event = new Event();
        event.setClubID(clubId);
        event.setSemesterID(activeSemester.getSemesterID());
        event.setEventCode(request.getEventCode() != null ? request.getEventCode() : "EVT-" + System.currentTimeMillis());
        event.setEventName(request.getEventName());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setBudget(request.getBudget());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setEventStatus("upcoming"); // default status for new events
        event.setIsResubmitted(false);
        event.setIsScoreLocked(false);
        event.setCreatedAt(LocalDateTime.now());
        event.setIsDeleted(false);

        event = eventRepository.save(event);
        return mapToDto(event);
    }

    private EventDto mapToDto(Event event) {
        EventDto dto = new EventDto();
        dto.setEventID(event.getEventID());
        dto.setClubID(event.getClubID());
        dto.setSemesterID(event.getSemesterID());
        dto.setEventCode(event.getEventCode());
        dto.setEventName(event.getEventName());
        dto.setDescription(event.getDescription());
        dto.setLocation(event.getLocation());
        dto.setBudget(event.getBudget());
        dto.setStartDate(event.getStartDate());
        dto.setEndDate(event.getEndDate());
        dto.setEventStatus(event.getEventStatus());
        dto.setCreatedAt(event.getCreatedAt());
        return dto;
    }
}
