package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ApplicationReviewRequest;
import com.fptu.fcms.dto.request.InterviewGradingRequest;
import com.fptu.fcms.dto.response.RecruitmentDecisionResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.RecruitmentReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recruitment")
@Tag(name = "Recruitment Review", description = "API duyệt đơn và chấm phỏng vấn ứng tuyển CLB")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class RecruitmentReviewController {

    private final RecruitmentReviewService recruitmentReviewService;

    @PostMapping("/applications/review")
    @PreAuthorize("hasRole('Leader')")
    @Operation(
            summary = "Duyệt đơn ứng tuyển CLB",
            description = "Leader của CLB chấp nhận hoặc từ chối đơn ứng tuyển, gửi email tự động và ghi audit log."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Application reviewed successfully",
            content = @Content(schema = @Schema(implementation = RecruitmentDecisionResponse.class))
    )
    public ResponseEntity<RecruitmentDecisionResponse> reviewApplication(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = ApplicationReviewRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "applicationId": 1,
                                      "isAccepted": true,
                                      "interviewTime": "2026-06-20T09:30:00",
                                      "interviewLocation": "Phòng 201, Alpha Building"
                                    }
                                    """)
                    )
            )
            @Valid @RequestBody ApplicationReviewRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(
                recruitmentReviewService.reviewApplication(request, currentUser.getUserId())
        );
    }

    @PostMapping("/interviews/grade")
    @PreAuthorize("hasRole('Leader')")
    @Operation(
            summary = "Chấm điểm phỏng vấn ứng tuyển CLB",
            description = "Leader của CLB lưu điểm phỏng vấn, xác định đậu/rớt, tự động tạo thành viên nếu đạt và ghi audit log."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Interview graded successfully",
            content = @Content(schema = @Schema(implementation = RecruitmentDecisionResponse.class))
    )
    public ResponseEntity<RecruitmentDecisionResponse> gradeInterview(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = InterviewGradingRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "applicationId": 1,
                                      "interviewScore": 8.5
                                    }
                                    """)
                    )
            )
            @Valid @RequestBody InterviewGradingRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(
                recruitmentReviewService.gradeInterview(request, currentUser.getUserId())
        );
    }
}
