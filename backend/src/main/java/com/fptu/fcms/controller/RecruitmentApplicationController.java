package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ApplyClubRequestDTO;
import com.fptu.fcms.dto.response.RecruitmentApplicationResponseDTO;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.RecruitmentApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
@Tag(name = "Recruitment Applications", description = "API nộp đơn ứng tuyển CLB")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class RecruitmentApplicationController {

    private final RecruitmentApplicationService recruitmentService;

    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Nộp đơn ứng tuyển CLB", description = "Dành cho sinh viên nộp đơn ứng tuyển. Chặn nếu bị blacklist hoặc vượt 4 CLB/đơn (BR-R01).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Nộp đơn thành công", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RecruitmentApplicationResponseDTO.class))),
            @ApiResponse(responseCode = "422", description = "Lỗi nghiệp vụ (Vượt quá giới hạn CLB hoặc nằm trong Blacklist)", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\n  \"error\": \"Bạn nằm trong danh sách đen của CLB này, không thể nộp đơn.\"\n}"))),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực (Thiếu hoặc sai token JWT)", content = @Content),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập", content = @Content)
    })
    public ResponseEntity<RecruitmentApplicationResponseDTO> applyForClub(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Thông tin đơn ứng tuyển", required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApplyClubRequestDTO.class),
                            examples = @ExampleObject(
                                    name = "Valid Application",
                                    summary = "Mẫu đơn ứng tuyển chuẩn",
                                    value = "{\n  \"clubID\": 1,\n  \"cvUrl\": \"https://drive.google.com/file/d/xxx\",\n  \"introduction\": \"Em rất đam mê nhiếp ảnh và muốn đóng góp cho CLB\",\n  \"answersJson\": \"{\\\"question1\\\": \\\"Có kinh nghiệm 2 năm\\\"}\"\n}"
                            )))
            @Valid @RequestBody ApplyClubRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestHeader(value = "X-Semester-ID", defaultValue = "1") Integer currentSemesterID) {
            
        // Security check: user is applying for themselves (Authz handled by JWT context)
        Integer userID = currentUser.getUserId();

        RecruitmentApplicationResponseDTO application = recruitmentService.applyForClub(request, userID, currentSemesterID);
        return ResponseEntity.status(HttpStatus.CREATED).body(application);
    }
}
