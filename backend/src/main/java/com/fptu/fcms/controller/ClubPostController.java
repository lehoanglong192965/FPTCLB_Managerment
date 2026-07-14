package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CreateClubPostRequest;
import com.fptu.fcms.dto.response.ClubPostPageResponse;
import com.fptu.fcms.dto.response.ClubPostResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubPostService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clubs/{clubId}/posts")
@RequiredArgsConstructor
public class ClubPostController {

    private final ClubPostService clubPostService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Leader/Phó Leader đăng bài lên bảng tin CLB")
    public ResponseEntity<ClubPostResponse> createPost(
            @PathVariable Integer clubId,
            @Valid @RequestBody CreateClubPostRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ClubPostResponse response = clubPostService.createPost(clubId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Thành viên CLB xem bảng tin")
    public ResponseEntity<ClubPostPageResponse> getPosts(
            @PathVariable Integer clubId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(clubPostService.getPosts(clubId, currentUser, page, size));
    }
}
