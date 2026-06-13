package com.fptu.fcms.controller;

import com.fptu.fcms.dto.DisciplineLogDTO;
import com.fptu.fcms.service.DisciplineLogService;
import com.fptu.fcms.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

/**
 * REST Controller cho DisciplineLog — API quản lý án kỷ luật.
 *
 * Toàn bộ endpoint yêu cầu xác thực JWT và phân quyền Admin hoặc ICPDP.
 * Khi tạo/cập nhật DisciplineLog có status = Active,
 * service sẽ tự động:
 * - đình chỉ tài khoản user bị kỷ luật
 * - hạ clubRoleID của Leader xuống Member
 * - ghi AuditLog
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
    @Operation(
            summary = "Tạo mới án kỷ luật",
            description = "Admin/ICPDP tạo án kỷ luật. Nếu status = Active thì tự động hạ Leader xuống Member."
    )
    public ResponseEntity<DisciplineLogDTO> createDisciplineLog(
            @Valid @RequestBody DisciplineLogDTO dto,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer actorID = principal != null ? principal.getUserId() : null;

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(disciplineLogService.createDisciplineLog(dto, actorID));
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Cập nhật án kỷ luật",
            description = "Chỉ cho phép sửa reason và disciplineStatus. Nếu status = Active thì tự động hạ Leader xuống Member."
    )
    public ResponseEntity<DisciplineLogDTO> updateDisciplineLog(
            @PathVariable Integer id,
            @Valid @RequestBody DisciplineLogDTO dto,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer actorID = principal != null ? principal.getUserId() : null;

        return ResponseEntity.ok(
                disciplineLogService.updateDisciplineLog(id, dto, actorID)
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm án kỷ luật", description = "Yêu cầu quyền Admin hoặc ICPDP")
    public ResponseEntity<Void> deleteDisciplineLog(@PathVariable Integer id) {
        disciplineLogService.deleteDisciplineLog(id);
        return ResponseEntity.noContent().build();
    }
}