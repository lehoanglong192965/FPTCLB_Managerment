package com.fptu.fcms.controller;

import com.fptu.fcms.dto.SemesterDTO;
import com.fptu.fcms.service.SemesterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@Tag(name = "Semester Management", description = "API quản lý cấu hình Học kỳ (Semester)")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả học kỳ")
    public ResponseEntity<List<SemesterDTO>> getAllSemesters() {
        return ResponseEntity.ok(semesterService.getAllSemesters());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin học kỳ theo ID")
    public ResponseEntity<SemesterDTO> getSemesterById(@PathVariable Integer id) {
        return ResponseEntity.ok(semesterService.getSemesterById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    @Operation(summary = "Tạo mới học kỳ", description = "Yêu cầu quyền Admin hoặc ICPDP")
    public ResponseEntity<SemesterDTO> createSemester(@Valid @RequestBody SemesterDTO semesterDTO) {
        return ResponseEntity.ok(semesterService.createSemester(semesterDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    @Operation(summary = "Cập nhật thông tin học kỳ", description = "Yêu cầu quyền Admin hoặc ICPDP")
    public ResponseEntity<SemesterDTO> updateSemester(@PathVariable Integer id, @Valid @RequestBody SemesterDTO semesterDTO) {
        return ResponseEntity.ok(semesterService.updateSemester(id, semesterDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    @Operation(summary = "Xóa mềm học kỳ", description = "Yêu cầu quyền Admin hoặc ICPDP")
    public ResponseEntity<Void> deleteSemester(@PathVariable Integer id) {
        semesterService.deleteSemester(id);
        return ResponseEntity.noContent().build();
    }
}
