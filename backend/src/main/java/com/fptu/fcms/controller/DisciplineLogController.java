package com.fptu.fcms.controller;

import com.fptu.fcms.dto.DisciplineLogDTO;
import com.fptu.fcms.service.DisciplineLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

/**
 * REST Controller cho DisciplineLog — API quản lý án kỷ luật.
 *
 * Toàn bộ endpoint yêu cầu xác thực JWT và phân quyền Admin hoặc ICPDP.
 * Mục đích chính: cung cấp dữ liệu kiểm thử cho các Business Rule liên quan
 * đến kỷ luật sinh viên (ví dụ: BR-01 chặn gán Leader cho SV có án kỷ luật).
 *
 * Lưu ý về @PreAuthorize:
 *   Các annotation @PreAuthorize("hasAnyRole(...)") yêu cầu SecurityConfig khai báo
 *   @EnableMethodSecurity. JwtAuthenticationFilter map role từ DB sang
 *   SimpleGrantedAuthority("ROLE_" + roleName), nên hasRole('Admin') khớp với ROLE_Admin.
 */
@RestController
@RequestMapping("/api/discipline-logs")
@Tag(name = "Discipline Log Management", description = "API quản lý án kỷ luật (dành cho Admin/ICPDP)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
@RequiredArgsConstructor
public class DisciplineLogController {

    private final DisciplineLogService disciplineLogService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả án kỷ luật")
    public ResponseEntity<List<DisciplineLogDTO>> getAllDisciplineLogs() {
        return ResponseEntity.ok(disciplineLogService.getAllDisciplineLogs());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin án kỷ luật theo ID")
    public ResponseEntity<DisciplineLogDTO> getDisciplineLogById(@PathVariable Integer id) {
        return ResponseEntity.ok(disciplineLogService.getDisciplineLogById(id));
    }

    @PostMapping
    @Operation(summary = "Tạo mới án kỷ luật", description = "Yêu cầu quyền Admin hoặc ICPDP")
    public ResponseEntity<DisciplineLogDTO> createDisciplineLog(@Valid @RequestBody DisciplineLogDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(disciplineLogService.createDisciplineLog(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật án kỷ luật", description = "Chỉ cho phép sửa reason và disciplineStatus")
    public ResponseEntity<DisciplineLogDTO> updateDisciplineLog(
            @PathVariable Integer id,
            @Valid @RequestBody DisciplineLogDTO dto) {
        return ResponseEntity.ok(disciplineLogService.updateDisciplineLog(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm án kỷ luật", description = "Yêu cầu quyền Admin hoặc ICPDP")
    public ResponseEntity<Void> deleteDisciplineLog(@PathVariable Integer id) {
        disciplineLogService.deleteDisciplineLog(id);
        return ResponseEntity.noContent().build();
    }
}
