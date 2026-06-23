package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ForceCloseSemesterRequest;
import com.fptu.fcms.dto.response.SemesterCloseResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.SemesterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/semesters")
@Tag(name = "Admin Semester Closure", description = "API đóng học kỳ và ghi đè khẩn cấp")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AdminSemesterController {

    private final SemesterService semesterService;

    @PutMapping("/{semesterId}/close")
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Đóng học kỳ thông thường")
    public ResponseEntity<SemesterCloseResponse> closeSemester(
            @PathVariable Integer semesterId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(semesterService.closeSemester(semesterId, currentUser));
    }

    @PutMapping("/{semesterId}/force-close")
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Ghi đè khẩn cấp để đóng học kỳ")
    public ResponseEntity<SemesterCloseResponse> forceCloseSemester(
            @PathVariable Integer semesterId,
            @Valid @RequestBody ForceCloseSemesterRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(semesterService.forceCloseSemester(semesterId, request, currentUser));
    }
}
