package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.ClubMemberResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubBoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller cho API quản lý thành viên CLB.
 * Base path: /api/clubs/{clubId}/members
 */
@RestController
@RequestMapping("/api/clubs/{clubId}/members")
@Tag(name = "Club Member Management", description = "API lấy danh sách toàn bộ thành viên CLB")
@SecurityRequirement(name = "bearerAuth")
public class ClubMemberController {

    private final ClubBoardService clubBoardService;

    public ClubMemberController(ClubBoardService clubBoardService) {
        this.clubBoardService = clubBoardService;
    }

    /**
     * Lấy danh sách tất cả thành viên của một CLB trong học kỳ đang Active.
     *
     * HTTP:  GET /api/clubs/{clubId}/members
     * Auth:  Người dùng đã đăng nhập
     *
     * @param clubId ID của CLB
     * @return 200 OK với danh sách ClubMemberResponse
     */
    @GetMapping
    @Operation(
            summary = "Lấy danh sách thành viên CLB",
            description = "Trả về tất cả thành viên (Leader, ViceLeader, CoreTeam, Member) " +
                    "trong CLB tại học kỳ đang Active."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "409", description = "Không có học kỳ Active")
    })
    public ResponseEntity<List<ClubMemberResponse>> getAllMembers(
            @Parameter(description = "ID của CLB", required = true)
            @PathVariable Integer clubId
    ) {
        List<ClubMemberResponse> members = clubBoardService.getAllMembers(clubId);
        return ResponseEntity.ok(members);
    }

    /**
     * Khai trừ một thành viên khỏi CLB (xóa mềm membership).
     *
     * HTTP:  DELETE /api/clubs/{clubId}/members/{membershipId}
     * Auth:  Leader đang active của chính CLB (kiểm tra chi tiết trong service)
     */
    @DeleteMapping("/{membershipId}")
    @PreAuthorize("hasRole('Leader')")
    @Operation(
            summary = "Khai trừ thành viên khỏi CLB",
            description = "Xóa mềm membership của thành viên trong học kỳ Active. " +
                    "Chỉ Leader của chính CLB được thực hiện; không thể khai trừ Leader hoặc chính mình."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Khai trừ thành công"),
            @ApiResponse(responseCode = "403", description = "Không có quyền hoặc vi phạm ràng buộc"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy thành viên"),
            @ApiResponse(responseCode = "409", description = "Không có học kỳ Active")
    })
    public ResponseEntity<Map<String, String>> removeMember(
            @Parameter(description = "ID của CLB", required = true)
            @PathVariable Integer clubId,
            @Parameter(description = "membershipID của thành viên cần khai trừ", required = true)
            @PathVariable Integer membershipId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        clubBoardService.removeMember(clubId, membershipId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of("message", "Đã khai trừ thành viên khỏi câu lạc bộ."));
    }
}