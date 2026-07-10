package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.event.KnowledgeArchiveIndexedEvent;
import com.fptu.fcms.repository.KnowledgeArchiveRepository;
import com.fptu.fcms.service.KnowledgeArchiveService;
import com.fptu.fcms.util.MarkdownSanitizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Implementation cho KnowledgeArchiveService.
 * Thứ tự xử lý file upload tuân thủ đúng DEV2 plan mục 4.2:
 * 1. Validate extension → 2. Validate size → 3. ClamAV scan → 4. PDF parse (nếu có)
 * → 5. Đọc content → 6. Sanitize → 7. Lưu file → 8. Lưu DB → 9. Publish event
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeArchiveServiceImpl implements KnowledgeArchiveService {

    private final KnowledgeArchiveRepository knowledgeArchiveRepository;
    private final ClamAvScanService clamAvScanService;
    private final MarkdownSanitizer markdownSanitizer;
    private final ApplicationEventPublisher eventPublisher;

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB - enforce ở Service, không đổi property global
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("md", "txt", "pdf");
    private static final String UPLOAD_DIR = "uploads/knowledge-archive";

    @Override
    @Transactional
    public KnowledgeArchive create(String title, MultipartFile file, Integer clubID,
                                   String visibilityScope, Integer uploadedByUserId,
                                   String roleName, String userClubRole, Integer userClubId) {
        // === Phân quyền: ép clubID/visibilityScope theo role ===
        if (isAdminOrIcpdp(roleName)) {
            visibilityScope = normalizeVisibilityScope(visibilityScope);
        } else if ("Leader".equals(userClubRole) || "ViceLeader".equals(userClubRole)) {
            clubID = userClubId; // Luôn ép theo token, bỏ qua giá trị client gửi lên
            visibilityScope = "ClubInternal"; // Leader/ViceLeader luôn bị ép ClubInternal
        } else {
            throw new AccessDeniedException("Bạn không có quyền tạo tài liệu Knowledge Archive.");
        }

        // clubID LUÔN NOT NULL, kể cả visibilityScope="Public"
        if (clubID == null) {
            throw new IllegalArgumentException("clubID là bắt buộc. Vui lòng chọn câu lạc bộ.");
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title must not be blank.");
        }
        String normalizedTitle = title.trim();

        // 1. Validate extension
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Chỉ chấp nhận file .md, .txt hoặc .pdf. Bạn đã gửi: ." + extension);
        }

        // 2. Validate size <= 5MB
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File vượt quá giới hạn 5MB. Kích thước file: " + (file.getSize() / (1024 * 1024)) + "MB.");
        }

        // 3. ClamAV virus scan — SAU size-check, TRƯỚC sanitize
        clamAvScanService.scan(file);

        // 4. Đọc content + PDF parse nếu cần
        String content;
        String sourceFormat;
        try {
            if ("pdf".equalsIgnoreCase(extension)) {
                // PDF: parse bằng opendataloader-pdf-core local/deterministic mode
                content = parsePdfToMarkdown(file);
                sourceFormat = "PDF";
                if (content == null || content.isBlank()) {
                    throw new IllegalArgumentException(
                            "File PDF không có text layer hoặc nội dung rỗng. "
                                    + "Vui lòng sử dụng file PDF có văn bản số hoặc chuyển sang định dạng .md/.txt.");
                }
            } else {
                content = new String(file.getBytes(), StandardCharsets.UTF_8);
                sourceFormat = "txt".equalsIgnoreCase(extension) ? "TXT" : "MD";
            }
        } catch (IOException e) {
            throw new IllegalStateException("Không thể đọc nội dung file.", e);
        }

        // 5. Sanitize
        content = markdownSanitizer.sanitize(content);

        // 6. Lưu file gốc vào uploads/ với tên UUID
        String savedFileName = UUID.randomUUID() + "." + extension;
        String fileUrl = saveFileToDisk(file, savedFileName);

        // 7. Lưu KnowledgeArchive
        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setClubID(clubID);
        archive.setTitle(normalizedTitle);
        archive.setContent(content);
        archive.setFileUrl(fileUrl);
        archive.setVisibilityScope(visibilityScope != null ? visibilityScope : "ClubInternal");
        archive.setIndexingStatus("Pending");
        archive.setSourceFormat(sourceFormat);
        archive.setUploadedBy(uploadedByUserId);
        archive.setCreatedAt(LocalDateTime.now());
        archive.setIsDeleted(false);

        KnowledgeArchive saved = knowledgeArchiveRepository.save(archive);

        // 8. Publish event
        eventPublisher.publishEvent(new KnowledgeArchiveIndexedEvent(saved.getArchiveID(), "CREATE"));

        return saved;
    }

    @Override
    public List<KnowledgeArchive> getByClub(Integer clubID) {
        return knowledgeArchiveRepository.findByClubIDAndIsDeletedFalse(clubID);
    }

    @Override
    public List<KnowledgeArchive> getPublic() {
        return knowledgeArchiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public");
    }

    @Override
    public KnowledgeArchive getById(Integer archiveID) {
        return knowledgeArchiveRepository.findByArchiveIDAndIsDeletedFalse(archiveID)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài liệu với ID: " + archiveID));
    }

    @Override
    @Transactional
    public void delete(Integer archiveID) {
        KnowledgeArchive archive = getById(archiveID);
        archive.setIsDeleted(true);
        knowledgeArchiveRepository.save(archive);

        // Publish DELETE event
        eventPublisher.publishEvent(new KnowledgeArchiveIndexedEvent(archiveID, "DELETE"));
    }

    @Override
    @Transactional
    public void reindex(Integer archiveID) {
        KnowledgeArchive archive = getById(archiveID);
        if (!"Failed".equals(archive.getIndexingStatus())) {
            throw new IllegalArgumentException(
                    "Chỉ có thể reindex tài liệu có trạng thái 'Failed'. Trạng thái hiện tại: "
                            + archive.getIndexingStatus());
        }
        archive.setIndexingStatus("Pending");
        knowledgeArchiveRepository.save(archive);

        // Publish UPDATE event
        eventPublisher.publishEvent(new KnowledgeArchiveIndexedEvent(archiveID, "UPDATE"));
    }

    // === Helper methods ===

    private boolean isAdminOrIcpdp(String roleName) {
        return "Admin".equals(roleName) || "ICPDP".equals(roleName);
    }

    private String normalizeVisibilityScope(String visibilityScope) {
        if (visibilityScope == null) {
            return "ClubInternal";
        }
        if ("Public".equals(visibilityScope) || "ClubInternal".equals(visibilityScope)) {
            return visibilityScope;
        }
        throw new IllegalArgumentException(
                "visibilityScope không hợp lệ. Chỉ chấp nhận 'Public' hoặc 'ClubInternal'.");
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("Tên file không hợp lệ hoặc không có phần mở rộng.");
        }
        // Chống path traversal: chỉ lấy tên file thuần, không cho ../
        String safeName = Paths.get(filename).getFileName().toString();
        int dotIndex = safeName.lastIndexOf('.');
        if (dotIndex < 0) {
            throw new IllegalArgumentException("Tên file không có phần mở rộng.");
        }
        return safeName.substring(dotIndex + 1);
    }

    private String saveFileToDisk(MultipartFile file, String savedFileName) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(savedFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return filePath.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Không thể lưu file lên server.", e);
        }
    }

    /**
     * Parse PDF → Markdown sử dụng opendataloader-pdf-core (local/deterministic mode).
     * KHÔNG bật hybrid/OCR mode.
     *
     * API thật: OpenDataLoaderPDF.processFile(filePath, config) — xử lý file trên disk,
     * output ra thư mục chỉ định. Ta đọc file .md output sau khi process xong.
     */
    private String parsePdfToMarkdown(MultipartFile file) {
        Path tempPdf = null;
        Path tempOutputDir = null;
        try {
            // 1. Lưu MultipartFile vào temp file
            tempPdf = Files.createTempFile("ka_pdf_", ".pdf");
            Files.copy(file.getInputStream(), tempPdf, StandardCopyOption.REPLACE_EXISTING);

            // 2. Tạo temp output directory
            tempOutputDir = Files.createTempDirectory("ka_pdf_output_");

            // 3. Config: chỉ generate Markdown, local/deterministic mode
            org.opendataloader.pdf.api.Config config = new org.opendataloader.pdf.api.Config();
            config.setOutputFolder(tempOutputDir.toString());
            config.setGenerateMarkdown(true);
            config.setGeneratePDF(false);
            config.setGenerateHtml(false);

            // 4. Process file
            org.opendataloader.pdf.api.OpenDataLoaderPDF.processFile(tempPdf.toString(), config);

            // 5. Đọc file markdown output
            // opendataloader output tên file dạng: <input_filename_without_extension>.md
            String baseName = tempPdf.getFileName().toString().replaceFirst("\\.pdf$", "");
            Path markdownOutput = tempOutputDir.resolve(baseName + ".md");

            if (Files.exists(markdownOutput)) {
                return Files.readString(markdownOutput, StandardCharsets.UTF_8);
            } else {
                // Thử tìm bất kỳ file .md nào trong output dir
                try (var mdFiles = Files.list(tempOutputDir)) {
                    return mdFiles
                            .filter(p -> p.toString().endsWith(".md"))
                            .findFirst()
                            .map(p -> {
                                try {
                                    return Files.readString(p, StandardCharsets.UTF_8);
                                } catch (IOException e) {
                                    return null;
                                }
                            })
                            .orElse(null);
                }
            }
        } catch (Exception e) {
            log.warn("Không thể parse PDF: {}", e.getMessage());
            return null;
        } finally {
            // Cleanup temp files
            try {
                if (tempPdf != null) Files.deleteIfExists(tempPdf);
                if (tempOutputDir != null) {
                    try (var walk = Files.walk(tempOutputDir)) {
                        walk.sorted(java.util.Comparator.reverseOrder())
                                .forEach(p -> {
                                    try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                                });
                    }
                }
            } catch (IOException ignored) {}
        }
    }
}
