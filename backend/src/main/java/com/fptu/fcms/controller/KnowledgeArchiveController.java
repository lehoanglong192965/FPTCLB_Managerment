package com.fptu.fcms.controller;

import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.KnowledgeArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Controller cho Knowledge Archive API.
 * Phân quyền dùng UserPrincipal.getClubId()/getClubRole() — không query DB thêm.
 * Đầu vào: Client gửi request upload file, tìm kiếm AI (có kèm JWT).
 * Đầu ra: Kiểm tra quyền truy cập thông qua @PreAuthorize (hoặc thủ công), nếu hợp lệ thì định tuyến gọi Service Layer xử lý logic, trả về dữ liệu chuẩn JSON.
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
     * Opens the original file through an authenticated endpoint.
     * fileUrl is an internal storage path, never a public URL.
     */
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> downloadOriginalFile(
            @PathVariable("id") Integer archiveID,
            Authentication authentication) {
        UserPrincipal me = currentUser(authentication);
        KnowledgeArchive archive = knowledgeArchiveService.getById(archiveID);
        assertCanViewArchive(me, archive);

        Path filePath = resolveStoredFilePath(archive);
        Resource resource = new FileSystemResource(filePath);
        String contentType = resolveContentType(filePath, archive.getSourceFormat());
        ContentDisposition contentDisposition = ContentDisposition.inline()
                .filename(filePath.getFileName().toString(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
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

    private Path resolveStoredFilePath(KnowledgeArchive archive) {
        if (archive.getFileUrl() == null || archive.getFileUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Original document file was not found.");
        }

        Path uploadRoot = Paths.get("uploads", "knowledge-archive").toAbsolutePath().normalize();
        Path filePath;
        try {
            filePath = Paths.get(archive.getFileUrl()).toAbsolutePath().normalize();
        } catch (InvalidPathException exception) {
            throw new AccessDeniedException("Invalid document file path.");
        }

        if (!filePath.startsWith(uploadRoot)) {
            throw new AccessDeniedException("Invalid document file path.");
        }
        if (!Files.isRegularFile(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Original document file was not found.");
        }
        return filePath;
    }

    private String resolveContentType(Path filePath, String sourceFormat) {
        try {
            String detectedContentType = Files.probeContentType(filePath);
            if (detectedContentType != null) {
                return detectedContentType;
            }
        } catch (IOException ignored) {
            // Fall back to sourceFormat when the operating system cannot detect the MIME type.
        }

        return switch (sourceFormat) {
            case "PDF" -> MediaType.APPLICATION_PDF_VALUE;
            case "TXT" -> MediaType.TEXT_PLAIN_VALUE;
            default -> "text/markdown";
        };
    }
}
