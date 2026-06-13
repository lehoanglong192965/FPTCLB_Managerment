package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.EventDto;
import com.fptu.fcms.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs/{clubId}/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<List<EventDto>> getEventsByClubId(@PathVariable Integer clubId) {
        return ResponseEntity.ok(eventService.getEventsByClubId(clubId));
    }

    @PostMapping
    public ResponseEntity<EventDto> createEvent(@PathVariable Integer clubId, @Valid @RequestBody EventDto request) {
        return ResponseEntity.ok(eventService.createEvent(clubId, request));
    }
}
