package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.ClubManagementSummaryDTO;
import com.fptu.fcms.service.ClubService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clubs/management")
@RequiredArgsConstructor
@Tag(name = "Club Management", description = "API quản trị danh sách câu lạc bộ")
@SecurityRequirement(name = "bearerAuth")
public class ClubManagementController {

    private final ClubService clubService;

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    @Operation(summary = "Lấy tất cả câu lạc bộ chưa bị xóa cho màn hình quản trị")
    public ResponseEntity<List<ClubManagementSummaryDTO>> getAllClubsForManagement() {
        return ResponseEntity.ok(clubService.getAllClubsForManagement());
    }
}
