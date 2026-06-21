package com.fptu.fcms.controller;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/icpdp/events")
@RequiredArgsConstructor
public class ICPDPEventController {

    private final EventService eventService;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<List<Event>> getPendingEvents() {
        return ResponseEntity.ok(eventService.getPendingEvents());
    }

    @GetMapping("/{eventId}")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<Event> getEventById(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getEventById(eventId));
    }

    @PatchMapping("/{eventId}/approve")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<Map<String, String>> approveEvent(@PathVariable Integer eventId) {
        eventService.approveEvent(eventId);
        return ResponseEntity.ok(Map.of("message", "Sự kiện đã được phê duyệt."));
    }

    @PatchMapping("/{eventId}/reject")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<Map<String, String>> rejectEvent(@PathVariable Integer eventId, @RequestBody Map<String, String> request) {
        eventService.rejectEvent(eventId, request.get("reason"));
        return ResponseEntity.ok(Map.of("message", "Sự kiện đã bị từ chối."));
    }
}
