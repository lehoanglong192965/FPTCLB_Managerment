package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.UpdateClubRequest;
import com.fptu.fcms.dto.request.ClubStatusUpdateRequestDTO;
import com.fptu.fcms.dto.response.ClubResponseDTO;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.service.ClubService;
import com.fptu.fcms.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs")
@Tag(name = "Clubs", description = "API hiển thị danh sách và chi tiết câu lạc bộ")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;
    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các câu lạc bộ đang hoạt động")
    public ResponseEntity<List<ClubResponseDTO>> getAllClubs() {
        return ResponseEntity.ok(clubService.getAllActiveClubs());
    }

    @GetMapping("/id/{clubId}")
    @Operation(summary = "Lấy thông tin chi tiết câu lạc bộ theo ID")
    public ResponseEntity<ClubResponseDTO> getClubById(@PathVariable Integer clubId) {
        return ResponseEntity.ok(clubService.getClubById(clubId));
    }

    @GetMapping("/{clubCode}")
    @Operation(summary = "Lấy thông tin chi tiết câu lạc bộ theo mã code viết tắt")
    public ResponseEntity<ClubResponseDTO> getClubByCode(@PathVariable String clubCode) {
        ClubResponseDTO club = clubService.getClubByCode(clubCode);
        if (club == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(club);
    }

    @PutMapping("/{clubId}")
    @PreAuthorize("hasRole('Leader')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cập nhật thông tin câu lạc bộ (chỉ Leader)")
    public ResponseEntity<ClubResponseDTO> updateClub(
            @PathVariable Integer clubId,
            @Valid @RequestBody UpdateClubRequest request
    ) {
        return ResponseEntity.ok(clubService.updateClub(clubId, request));
    } 

    @GetMapping("/{clubId}/events")
    @Operation(summary = "Lấy danh sách sự kiện của câu lạc bộ")
    public ResponseEntity<List<Event>> getEventsByClubId(@PathVariable Integer clubId) {
        return ResponseEntity.ok(eventService.getEventsByClubId(clubId));
    }

    @PatchMapping("/{clubId}/review")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    @SecurityRequirement(name = "bearerAuth") // Thêm để Swagger hiện ổ khóa JWT
    @Operation(summary = "Duyệt trạng thái câu lạc bộ (Active, Suspended, Dissolved)")
    public ResponseEntity<Map<String, String>> reviewClub(
            @PathVariable Integer clubId,
            @RequestBody ClubStatusUpdateRequestDTO request) {
        clubService.updateClubStatus(clubId, request.getStatus(), request.getReason());
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công"));
    }
}