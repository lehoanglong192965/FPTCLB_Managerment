package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ClubBoardChangeRequest;
import com.fptu.fcms.dto.response.ClubBoardMemberResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubBoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho các API quản lý Thành viên CLB (Membership).
 *
 * Base path: /api/clubs/{clubId}/board
 *
 * Phân quyền:
 *   - GET  /api/clubs/{clubId}/board          → Admin, ICPDP, Leader của CLB (xem danh sách)
 *   - PUT  /api/clubs/{clubId}/board           → chỉ Admin và ICPDP (thay đổi ban điều hành)
 *
 * Lưu ý về @PreAuthorize:
 *   Dự án dùng JWT với Spring Security. Role được lưu trong UserPrincipal.roleId.
 *   Các annotation @PreAuthorize("hasRole(...)") yêu cầu SecurityConfig khai báo
 *   authorities từ roleId (đã có trong JwtAuthenticationFilter hiện tại).
 */
@RestController
@RequestMapping("/api/clubs/{clubId}/board")
@Tag(name = "Club Board Management", description = "API quản lý Ban điều hành CLB — Bổ nhiệm và Bãi nhiệm Leader")
@SecurityRequirement(name = "bearerAuth")
public class MembershipController {

    private final ClubBoardService clubBoardService;

    public MembershipController(ClubBoardService clubBoardService) {
        this.clubBoardService = clubBoardService;
    }

    // =====================================================================
    // GET: LẤY DANH SÁCH BAN ĐIỀU HÀNH CLB HIỆN TẠI
    // =====================================================================

    /**
     * Lấy danh sách tất cả thành viên trong Ban điều hành của một CLB
     * tại học kỳ đang Active.
     *
     * HTTP:  GET /api/clubs/{clubId}/board
     * Auth:  Tất cả người dùng đã đăng nhập (xem công khai)
     *
     * @param clubId ID của CLB cần xem danh sách ban điều hành
     * @return 200 OK với danh sách ClubBoardMemberResponse
     */
    @GetMapping
    @Operation(
            summary = "Xem danh sách Ban điều hành CLB",
            description = "Trả về danh sách tất cả thành viên (Leader, ViceLeader, Member) " +
                    "trong CLB tại học kỳ đang Active."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "409", description = "Không có học kỳ Active",
                    content = @Content(schema = @Schema(implementation = Object.class)))
    })
    public ResponseEntity<List<ClubBoardMemberResponse>> getBoardMembers(
            @Parameter(description = "ID của CLB", required = true)
            @PathVariable Integer clubId
    ) {
        List<ClubBoardMemberResponse> members = clubBoardService.getBoardMembers(clubId);
        return ResponseEntity.ok(members);
    }

    // =====================================================================
    // PUT: THAY ĐỔI BAN ĐIỀU HÀNH (BỔ NHIỆM / BÃI NHIỆM)
    // =====================================================================

    /**
     * Bổ nhiệm hoặc bãi nhiệm một thành viên trong Ban điều hành CLB.
     *
     * HTTP:  PUT /api/clubs/{clubId}/board
     * Auth:  Chỉ Admin hoặc ICPDP (cán bộ phòng IC-PDP được phép thực hiện)
     *
     * Request Body mẫu (Bổ nhiệm Leader):
     * {
     *   "userID": 42,
     *   "action": "APPOINT",
     *   "newRole": "Leader",
     *   "reason": "Bổ nhiệm Leader mới học kỳ SU26"
     * }
     *
     * Request Body mẫu (Bãi nhiệm):
     * {
     *   "userID": 42,
     *   "action": "DISMISS",
     *   "reason": "Vi phạm nội quy CLB"
     * }
     *
     * Business Rules kiểm tra (xem chi tiết ở ClubBoardService):
     *   BR-A05: Chặn cán bộ ICPDP/Admin được thêm vào CLB với vai trò Member/Leader/ViceLeader
     *   BR-A02: Chặn một sinh viên làm Leader ở 2 CLB trong cùng học kỳ
     *   Rule phụ: Chặn gán Leader nếu có án kỷ luật Active
     *   Rule phụ: Tự động bãi nhiệm Leader cũ khi bổ nhiệm Leader mới trong cùng CLB
     *
     * @param clubId     ID của CLB cần thay đổi ban điều hành
     * @param request    Body JSON chứa thông tin yêu cầu (đã validate bằng @Valid)
     * @param principal  JWT principal của người gọi API (inject tự động bởi Spring Security)
     * @return 200 OK với thông tin membership sau khi thay đổi
     */
     @PutMapping
 //    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
     @Operation(
             summary = "Thay đổi Ban điều hành CLB (Bổ nhiệm / Bãi nhiệm)",
             description = "**Yêu cầu quyền:** Admin hoặc ICPDP\n\n" +
                     "**Các Business Rule được kiểm tra:**\n" +
                     "- BR-A05: Chặn tài khoản ICPDP/Admin tham gia CLB với vai trò Member/Leader/ViceLeader\n" +
                     "- BR-A02: Một sinh viên chỉ được làm Leader của 1 CLB trong 1 học kỳ\n" +
                     "- Rule phụ: Chặn bổ nhiệm Leader nếu sinh viên có án kỷ luật Active trong bảng DisciplineLog\n" +
                     "- Rule phụ: Khi bổ nhiệm Leader mới - Leader cũ của chính CLB đó sẽ tự động bị bãi nhiệm (atomic)\n\n" +
                     "**@Transactional:** Toàn bộ thao tác là atomic - nếu có lỗi, mọi thay đổi sẽ bị rollback."
     )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thao tác thành công"),
            @ApiResponse(responseCode = "400", description = "Request không hợp lệ (validation lỗi)",
                    content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện hoặc vi phạm BR-02",
                    content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "404", description = "User hoặc CLB không tồn tại",
                    content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "409", description = "Không có học kỳ Active",
                    content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "422", description = "Vi phạm Business Rule (BR-01, BR-03)",
                    content = @Content(schema = @Schema(implementation = Object.class)))
    })
    public ResponseEntity<ClubBoardMemberResponse> changeBoardMember(
            @Parameter(description = "ID của CLB", required = true)
            @PathVariable Integer clubId,

            @Parameter(description = "Thông tin yêu cầu bổ nhiệm/bãi nhiệm", required = true)
            @Valid @RequestBody ClubBoardChangeRequest request,

            // Lấy actorID từ JWT token — người đang đăng nhập thực hiện thao tác
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        // NOTE:
        // Lấy ID của người thực hiện từ JWT để ghi AuditLog.
        // Actor là Admin/ICPDP đang thao tác, còn request.userID là người bị bổ nhiệm/bãi nhiệm.
        Integer actorID = principal.getUserId();

        ClubBoardMemberResponse result = clubBoardService.changeBoardMember(clubId, request, actorID);
        return ResponseEntity.ok(result);
    }
}