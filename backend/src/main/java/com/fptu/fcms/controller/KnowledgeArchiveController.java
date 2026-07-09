package com.fptu.fcms.controller;

import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.KnowledgeArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller cho Knowledge Archive API.
 * Phân quyền dùng UserPrincipal.getClubId()/getClubRole() — không query DB thêm.
 */
@RestController
@RequestMapping("/api/v1/knowledge-archive")
@RequiredArgsConstructor
public class KnowledgeArchiveController {

    private final KnowledgeArchiveService knowledgeArchiveService;

    /**
     * Tạo mới tài liệu tri thức (upload file).
     */
    @PostMapping
    public ResponseEntity<KnowledgeArchive> create(
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "clubID", required = false) Integer clubID,
            @RequestParam(value = "visibilityScope", required = false, defaultValue = "ClubInternal") String visibilityScope,
            Authentication authentication) {

        UserPrincipal me = currentUser(authentication);

        KnowledgeArchive created = knowledgeArchiveService.create(
                title, file, clubID, visibilityScope,
                me.getUserId(), me.getRoleName(), me.getClubRole(), me.getClubId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lấy danh sách tài liệu theo CLB.
     */
    @GetMapping("/club/{clubID}")
    public ResponseEntity<List<KnowledgeArchive>> getByClub(
            @PathVariable Integer clubID,
            Authentication authentication) {
        UserPrincipal me = currentUser(authentication);
        if (!isAdminOrIcpdp(me) && !isOwnClubLeader(me, clubID)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập tài liệu của câu lạc bộ này.");
        }
        return ResponseEntity.ok(knowledgeArchiveService.getByClub(clubID));
    }

    /**
     * Lấy danh sách tài liệu Public.
     */
    @GetMapping("/public")
    public ResponseEntity<List<KnowledgeArchive>> getPublic() {
        return ResponseEntity.ok(knowledgeArchiveService.getPublic());
    }

    /**
     * Lấy chi tiết 1 tài liệu.
     */
    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeArchive> getById(
            @PathVariable("id") Integer archiveID,
            Authentication authentication) {
        UserPrincipal me = currentUser(authentication);
        KnowledgeArchive archive = knowledgeArchiveService.getById(archiveID);
        assertCanViewArchive(me, archive);
        return ResponseEntity.ok(archive);
    }

    /**
     * Soft delete tài liệu.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable("id") Integer archiveID,
            Authentication authentication) {
        UserPrincipal me = currentUser(authentication);
        KnowledgeArchive archive = knowledgeArchiveService.getById(archiveID);
        assertCanManageArchive(me, archive);
        knowledgeArchiveService.delete(archiveID);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reindex tài liệu có indexingStatus='Failed' → set về 'Pending' + bắn event UPDATE.
     */
    @PostMapping("/{id}/reindex")
    public ResponseEntity<Void> reindex(
            @PathVariable("id") Integer archiveID,
            Authentication authentication) {
        UserPrincipal me = currentUser(authentication);
        KnowledgeArchive archive = knowledgeArchiveService.getById(archiveID);
        assertCanManageArchive(me, archive);
        knowledgeArchiveService.reindex(archiveID);
        return ResponseEntity.ok().build();
    }

    private UserPrincipal currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal me)) {
            throw new AccessDeniedException("Yêu cầu đăng nhập hợp lệ.");
        }
        return me;
    }

    private void assertCanViewArchive(UserPrincipal me, KnowledgeArchive archive) {
        if ("Public".equals(archive.getVisibilityScope())) {
            return;
        }
        assertCanManageArchive(me, archive);
    }

    private void assertCanManageArchive(UserPrincipal me, KnowledgeArchive archive) {
        if (isAdminOrIcpdp(me) || isOwnClubLeader(me, archive.getClubID())) {
            return;
        }
        throw new AccessDeniedException("Bạn không có quyền truy cập tài liệu này.");
    }

    private boolean isAdminOrIcpdp(UserPrincipal me) {
        return "Admin".equals(me.getRoleName()) || "ICPDP".equals(me.getRoleName());
    }

    private boolean isOwnClubLeader(UserPrincipal me, Integer targetClubId) {
        return ("Leader".equals(me.getClubRole()) || "ViceLeader".equals(me.getClubRole()))
                && targetClubId != null && targetClubId.equals(me.getClubId());
    }
}
