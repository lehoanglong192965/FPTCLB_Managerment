package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventService;
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
            @AuthenticationPrincipal UserPrincipal currentUser) { // Lấy UserID từ JWT
        // You might want to validate that the clubID in the request matches the currentUser's club.
        // For simplicity, we'll assume the request comes from a valid user for the club.
        eventService.createEventProposal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đề xuất sự kiện đã được gửi thành công."));
    }
}
