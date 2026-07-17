package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.RecruitmentCycleRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentCycleResponseDTO;
import com.fptu.fcms.service.RecruitmentCycleService;
import com.fptu.fcms.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recruitments")
@Tag(name = "Recruitment Cycles", description = "API quản lý đợt tuyển dụng và cấu trúc câu hỏi (JSON)")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class RecruitmentCycleController {

    private final RecruitmentCycleService cycleService;

    @GetMapping("/club/{clubId}")
    @PreAuthorize("hasAnyRole('Admin','ICPDP','Leader','ViceLeader')")
    @Operation(summary = "Lấy các đợt tuyển thành viên của một CLB")
    public ResponseEntity<List<RecruitmentCycleResponseDTO>> getClubCycles(
            @PathVariable Integer clubId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(cycleService.getClubCycles(clubId, currentUser));
    }

    @PostMapping("/club/{clubId}")
    @PreAuthorize("hasAnyRole('Admin','ICPDP','Leader','ViceLeader')")
    @Operation(summary = "Tạo và mở đợt tuyển thành viên cho một CLB")
    public ResponseEntity<RecruitmentCycleResponseDTO> createClubCycle(
            @PathVariable Integer clubId,
            @Valid @RequestBody RecruitmentCycleRequestDTO dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cycleService.createClubCycle(clubId, dto, currentUser));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('Admin','ICPDP','Leader','ViceLeader')")
    @Operation(summary = "Mở hoặc đóng đợt tuyển thành viên của CLB")
    public ResponseEntity<RecruitmentCycleResponseDTO> changeClubCycleStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(cycleService.changeClubCycleStatus(id, body.get("status"), currentUser));
    }

    @GetMapping("/{seasonId}/clubs")
    @PreAuthorize("hasAnyRole('Admin','ICPDP')")
    @Operation(summary = "Xem các CLB tham gia một mùa tuyển dụng")
    public ResponseEntity<List<RecruitmentCycleResponseDTO>> getSeasonClubCycles(
            @PathVariable Integer seasonId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(cycleService.getSeasonClubCycles(seasonId, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','ICPDP')")
    @Operation(summary = "Tạo đợt tuyển dụng mới", description = "Tạo đợt tuyển dụng kèm cấu trúc câu hỏi dạng JSON")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Created - Tạo thành công", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RecruitmentCycleResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request - Dữ liệu đầu vào không hợp lệ (Validation Error)", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Chưa xác thực (Thiếu token)", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Không có quyền truy cập (Sai Role)", content = @Content)
    })
    public ResponseEntity<RecruitmentCycleResponseDTO> createCycle(@Valid @RequestBody RecruitmentCycleRequestDTO dto) {
        RecruitmentCycleResponseDTO created = cycleService.createCycle(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','ICPDP')")
    @Operation(summary = "Cập nhật đợt tuyển dụng", description = "Cập nhật tiêu đề, ngày bắt đầu, hoặc cấu trúc câu hỏi JSON")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OK - Cập nhật thành công", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RecruitmentCycleResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request - Dữ liệu không hợp lệ", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Chưa xác thực", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Không có quyền", content = @Content),
            @ApiResponse(responseCode = "404", description = "Not Found - Không tìm thấy đợt tuyển dụng theo ID", content = @Content)
    })
    public ResponseEntity<RecruitmentCycleResponseDTO> updateCycle(@PathVariable Integer id, @Valid @RequestBody RecruitmentCycleRequestDTO dto) {
        return ResponseEntity.ok(cycleService.updateCycle(id, dto));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin đợt tuyển dụng theo ID", description = "Bao gồm trường questionsJson chứa schema câu hỏi (JSON string)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OK - Lấy thông tin thành công", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RecruitmentCycleResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Chưa xác thực", content = @Content),
            @ApiResponse(responseCode = "404", description = "Not Found - Không tìm thấy đợt tuyển dụng", content = @Content)
    })
    public ResponseEntity<RecruitmentCycleResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(cycleService.getCycleById(id));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách đợt tuyển dụng", description = "Trả về tất cả đợt (loại trừ đã soft-delete)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OK - Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Chưa xác thực", content = @Content)
    })
    public ResponseEntity<List<RecruitmentCycleResponseDTO>> getAll() {
        return ResponseEntity.ok(cycleService.getAllCycles());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','ICPDP')")
    @Operation(summary = "Xóa mềm đợt tuyển dụng", description = "Soft-delete để giữ log dữ liệu")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "No Content - Xóa thành công"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Chưa xác thực", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Không có quyền", content = @Content),
            @ApiResponse(responseCode = "404", description = "Not Found - Không tìm thấy đợt tuyển dụng", content = @Content)
    })
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        cycleService.softDeleteCycle(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/remind")
    @PreAuthorize("hasAnyRole('Admin','ICPDP')")
    @Operation(summary = "Gửi nhắc thủ công cho BĐH (Close or Extend)", description = "Dùng để test hoặc gửi lại reminder cho đợt tuyển dụng cụ thể")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OK - Reminder queued/sent", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Chưa xác thực", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Không có quyền", content = @Content),
            @ApiResponse(responseCode = "404", description = "Not Found - Không tìm thấy đợt tuyển dụng", content = @Content)
    })
    public ResponseEntity<Void> manualReminder(@PathVariable Integer id) {
        cycleService.triggerReminderForCycle(id);
        return ResponseEntity.ok().build();
    }
}
