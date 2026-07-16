package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.EventRejectRequest;
import com.fptu.fcms.dto.response.EventDetailResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/icpdp/events", "/api/v1/icpdp/events"})
@RequiredArgsConstructor
@Tag(name = "ICPDP Event Approval", description = "API duyet va tu choi event danh cho ICPDP")
public class ICPDPEventController {

    private final EventService eventService;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ICPDP')")
    @Operation(summary = "Lay danh sach event dang cho ICPDP duyet")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Danh sach event chua duyet", content = @Content(schema = @Schema(implementation = Event.class))),
            @ApiResponse(responseCode = "403", description = "Khong co quyen truy cap", content = @Content)
    })
    public ResponseEntity<List<Event>> getPendingEvents() {
        return ResponseEntity.ok(eventService.getPendingEvents());
    }

    @GetMapping("/approved")
    @PreAuthorize("hasRole('ICPDP')")
    @Operation(summary = "Lay lich su event da phe duyet (bao gom ca da ket thuc)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Danh sach event da phe duyet", content = @Content(schema = @Schema(implementation = Event.class))),
            @ApiResponse(responseCode = "403", description = "Khong co quyen truy cap", content = @Content)
    })
    public ResponseEntity<List<Event>> getApprovedEvents() {
        return ResponseEntity.ok(eventService.getIcpdpApprovedEvents());
    }

    @GetMapping("/rejected")
    @PreAuthorize("hasRole('ICPDP')")
    @Operation(summary = "Lay lich su event da bi tu choi")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Danh sach event da bi tu choi", content = @Content(schema = @Schema(implementation = Event.class))),
            @ApiResponse(responseCode = "403", description = "Khong co quyen truy cap", content = @Content)
    })
    public ResponseEntity<List<Event>> getRejectedEvents() {
        return ResponseEntity.ok(eventService.getRejectedEvents());
    }

    @GetMapping("/{eventId}")
    @PreAuthorize("hasRole('ICPDP')")
    @Operation(summary = "Lay chi tiet event theo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thong tin event", content = @Content(schema = @Schema(implementation = EventDetailResponse.class))),
            @ApiResponse(responseCode = "404", description = "Event khong ton tai", content = @Content)
    })
    public ResponseEntity<EventDetailResponse> getEventById(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.getManagedEventDetail(eventId, currentUser));
    }

    @PatchMapping("/{eventId}/approve")
    @PreAuthorize("hasRole('ICPDP')")
    @Operation(summary = "Phe duyet event")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Event da duoc phe duyet", content = @Content(schema = @Schema(type = "object"))),
            @ApiResponse(responseCode = "400", description = "Du lieu khong hop le", content = @Content),
            @ApiResponse(responseCode = "403", description = "Khong co quyen", content = @Content),
            @ApiResponse(responseCode = "404", description = "Event khong ton tai", content = @Content)
    })
    public ResponseEntity<Map<String, String>> approveEvent(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.approveEvent(eventId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Su kien da duoc phe duyet."));
    }

    @PatchMapping("/{eventId}/reject")
    @PreAuthorize("hasRole('ICPDP')")
    @Operation(summary = "Tu choi event")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Event da bi tu choi", content = @Content(schema = @Schema(type = "object"))),
            @ApiResponse(responseCode = "400", description = "Du lieu khong hop le", content = @Content),
            @ApiResponse(responseCode = "403", description = "Khong co quyen", content = @Content),
            @ApiResponse(responseCode = "404", description = "Event khong ton tai", content = @Content)
    })
    public ResponseEntity<Map<String, String>> rejectEvent(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventRejectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.rejectEvent(eventId, request.getReason(), currentUser);
        return ResponseEntity.ok(Map.of("message", "Su kien da bi tu choi."));
    }
}
