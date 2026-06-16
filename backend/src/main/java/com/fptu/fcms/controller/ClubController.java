package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.ClubResponseDTO;
import com.fptu.fcms.service.ClubService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@Tag(name = "Clubs", description = "API hiển thị danh sách và chi tiết câu lạc bộ")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các câu lạc bộ đang hoạt động")
    public ResponseEntity<List<ClubResponseDTO>> getAllClubs() {
        return ResponseEntity.ok(clubService.getAllActiveClubs());
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
}
