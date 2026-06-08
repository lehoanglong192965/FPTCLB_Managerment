package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ClubBlacklistRequest;
import com.fptu.fcms.service.ClubBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clubs/{clubID}/blacklist")
@RequiredArgsConstructor
public class ClubBlacklistController {

    private final ClubBlacklistService clubBlacklistService;
    // Lấy danh sách blacklist của CLB

    @GetMapping
    public ResponseEntity<?> getBlacklist(
            @PathVariable Long clubID
    ) {
        return ResponseEntity.ok(
                clubBlacklistService.getBlacklist(clubID)
        );
    }
    // Thêm sinh viên vào blacklist

    @PostMapping
    public ResponseEntity<?> addToBlacklist(
            @PathVariable Long clubID,
            @RequestBody ClubBlacklistRequest request
    ) {
        return ResponseEntity.ok(
                clubBlacklistService.addToBlacklist(clubID, request)
        );
    }
    // Cập nhật thông tin blacklist

    @PutMapping("/{blacklistID}")
    public ResponseEntity<?> updateBlacklist(
            @PathVariable Long clubID,
            @PathVariable Long blacklistID,
            @RequestBody ClubBlacklistRequest request
    ) {
        return ResponseEntity.ok(
                clubBlacklistService.updateBlacklist(
                        clubID,
                        blacklistID,
                        request
                )
        );
    }
    // Xóa mềm blacklist

    @DeleteMapping("/{blacklistID}")
    public ResponseEntity<?> removeBlacklist(
            @PathVariable Long clubID,
            @PathVariable Long blacklistID
    ) {
        clubBlacklistService.removeBlacklist(
                clubID,
                blacklistID
        );

        return ResponseEntity.ok("Removed successfully");
    }
}