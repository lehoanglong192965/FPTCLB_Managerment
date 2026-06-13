package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ClubRequest;
import com.fptu.fcms.dto.request.ClubStatusRequest;
import com.fptu.fcms.dto.response.ClubResponse;
import com.fptu.fcms.service.ClubService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    @GetMapping
    public ResponseEntity<List<ClubResponse>> getAllClubs() {
        return ResponseEntity.ok(clubService.getAllClubs());
    }

    @PostMapping
    public ResponseEntity<ClubResponse> createClub(@Valid @RequestBody ClubRequest request) {
        return ResponseEntity.ok(clubService.createClub(request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ClubResponse> updateClubStatus(@PathVariable Integer id, @Valid @RequestBody ClubStatusRequest request) {
        return ResponseEntity.ok(clubService.updateClubStatus(id, request));
    }
}
