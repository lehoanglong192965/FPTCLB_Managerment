package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping("/registerEvent")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')") // Chỉ Leader/Vice Leader mới được đề xuất
    public ResponseEntity<Map<String, String>> createEventProposal(
            @RequestBody CreateEventProposalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        // You might want to validate that the clubID in the request matches the currentUser's club.
        // For simplicity, we'll assume the request comes from a valid user for the club.
        eventService.createEventProposal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đề xuất sự kiện đã được gửi thành công."));
    }

    @PatchMapping("/{clubId}/{eventId}/cancel")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> cancelEvent(
            @PathVariable Integer clubId,

            @PathVariable Integer eventId,

            @Valid @RequestBody CancelEventRequest request) {
        
        eventService.cancelEvent(clubId, eventId, request);
        return ResponseEntity.ok(Map.of("message", "Sự kiện đã được hủy và thông báo đã được gửi tới người tham dự."));
    }
}
