package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.event.KnowledgeArchiveIndexedEvent;
import com.fptu.fcms.repository.KnowledgeArchiveRepository;
import com.fptu.fcms.util.MarkdownSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * TC2-03 → TC2-11: Tests cho KnowledgeArchiveServiceImpl.
 * Dùng real MarkdownSanitizer + mock ClamAvScanService/Repository/EventPublisher.
 *
 * LƯU Ý: Mockito trên Java 26 không mock được concrete class.
 * ClamAvScanService là concrete class (@Service) nên cần dùng interface wrapper
 * hoặc spy. Ở đây ta dùng ReflectionTestUtils để inject mock trực tiếp.
 */
class KnowledgeArchiveServiceImplTest {

    private KnowledgeArchiveServiceImpl service;

    private KnowledgeArchiveRepository repository;
    private ClamAvScanService clamAvScanService;
    private ApplicationEventPublisher eventPublisher;
    private MarkdownSanitizer sanitizer;

    @BeforeEach
    void setUp() {
        // ClamAvScanService không mock được trên Java 26 (ByteBuddy)
        // → tạo mock interface thay thế
        repository = mock(KnowledgeArchiveRepository.class);
        eventPublisher = mock(ApplicationEventPublisher.class);
        sanitizer = new MarkdownSanitizer(); // dùng thật, không mock

        // Tạo service bằng constructor injection manual
        // ClamAvScanService phải set riêng vì nó là concrete class
        service = new KnowledgeArchiveServiceImpl(
                repository,
                null, // clamAvScanService — set riêng bằng reflection
                sanitizer,
                eventPublisher
        );

        // Dùng dummy ClamAvScanService (skip scan) thay vì mock
        ClamAvScanService dummyClamAv = new ClamAvScanService();
        // host/port mặc định = localhost:3310, sẽ ConnectException → skip scan ở dev mode
        ReflectionTestUtils.setField(dummyClamAv, "host", "localhost");
        ReflectionTestUtils.setField(dummyClamAv, "port", 3310);
        ReflectionTestUtils.setField(service, "clamAvScanService", dummyClamAv);
    }

    private MockMultipartFile createMdFile(String content) {
        return new MockMultipartFile(
                "file", "test-doc.md",
                "text/markdown",
                content.getBytes(StandardCharsets.UTF_8)
        );
    }

    private MockMultipartFile createTxtFile(String content) {
        return new MockMultipartFile(
                "file", "test-doc.txt",
                "text/plain",
                content.getBytes(StandardCharsets.UTF_8)
        );
    }

    private MockMultipartFile createPdfFile(String originalFilename, byte[] content) {
        return new MockMultipartFile(
                "file", originalFilename,
                "application/pdf",
                content
        );
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "   ", "\t"})
    @DisplayName("Create rejects null, empty, or whitespace-only title before scanning or persistence")
    void createRejectsBlankTitleBeforeFileProcessing(String title) {
        AtomicInteger scanCalls = new AtomicInteger();
        ClamAvScanService recordingClamAv = new ClamAvScanService() {
            @Override
            public void scan(org.springframework.web.multipart.MultipartFile file) {
                scanCalls.incrementAndGet();
            }
        };
        ReflectionTestUtils.setField(service, "clamAvScanService", recordingClamAv);

        assertThatThrownBy(() -> service.create(
                title, createMdFile("# Content"), 1, "ClubInternal", 42, "Admin", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Title");

        assertThat(scanCalls).hasValue(0);
        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Create trims title before saving")
    void createTrimsTitleBeforeSaving() throws Exception {
        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(invocation -> {
                    KnowledgeArchive archive = invocation.getArgument(0);
                    archive.setArchiveID(90);
                    return archive;
                });

        KnowledgeArchive result = service.create(
                "  Trimmed title  ", createMdFile("# Content"),
                1, "ClubInternal", 42, "Admin", null, null);

        try {
            assertThat(result.getTitle()).isEqualTo("Trimmed title");
            verify(repository).save(argThat(archive -> "Trimmed title".equals(archive.getTitle())));
        } finally {
            Files.deleteIfExists(Paths.get(result.getFileUrl()));
        }
    }

    @Test
    @DisplayName("Create rejects titles longer than the baseline database contract before scanning")
    void createRejectsTitleLongerThanDatabaseContract() {
        AtomicInteger scanCalls = new AtomicInteger();
        ClamAvScanService recordingClamAv = new ClamAvScanService() {
            @Override
            public void scan(org.springframework.web.multipart.MultipartFile file) {
                scanCalls.incrementAndGet();
            }
        };
        ReflectionTestUtils.setField(service, "clamAvScanService", recordingClamAv);

        assertThatThrownBy(() -> service.create(
                "T".repeat(201), createMdFile("# Content"), 1, "ClubInternal", 42, "Admin", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("200");

        assertThat(scanCalls).hasValue(0);
        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }
    @Test
    @DisplayName("TC2-03: Upload file 6MB → IllegalArgumentException")
    void tc2_03_rejectsLargeFile() {
        // Arrange — 6MB file
        byte[] bigContent = new byte[6 * 1024 * 1024];
        MockMultipartFile bigFile = new MockMultipartFile(
                "file", "big.md", "text/markdown", bigContent);

        // Act & Assert
        assertThatThrownBy(() ->
                service.create("Big Doc", bigFile, 1, "ClubInternal", 42, "Admin", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5MB");

        // Không lưu DB
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("TC2-03 (variant): Upload file đúng extension .exe → bị chặn")
    void tc2_03_rejectsInvalidExtension() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file", "virus.exe", "application/octet-stream", "bad".getBytes());

        assertThatThrownBy(() ->
                service.create("Virus", exeFile, 1, "ClubInternal", 42, "Admin", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(".exe");
    }

    @Test
    @DisplayName("TC2-04: Upload file tên ../../../etc/passwd.md → lưu với tên UUID, không có ../")
    void tc2_04_preventsPathTraversal() {
        // Arrange
        MockMultipartFile traversalFile = new MockMultipartFile(
                "file", "../../../etc/passwd.md",
                "text/markdown",
                "# Safe content".getBytes(StandardCharsets.UTF_8)
        );

        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> {
                    KnowledgeArchive a = inv.getArgument(0);
                    a.setArchiveID(1);
                    return a;
                });

        // Act
        KnowledgeArchive result = service.create(
                "Path Traversal Test", traversalFile, 1,
                "ClubInternal", 42, "Admin", null, null);

        // Assert — fileUrl không chứa ../
        assertThat(result.getFileUrl()).doesNotContain("../");
        assertThat(result.getFileUrl()).doesNotContain("..\\");
    }

    @Test
    @DisplayName("TC2-05: ClamAV virus → không lưu DB, không bắn event")
    void tc2_05_virusScanBlocksSave() {
        // Arrange — tạo service với ClamAV ném exception
        ClamAvScanService virusClamAv = new ClamAvScanService() {
            @Override
            public void scan(org.springframework.web.multipart.MultipartFile file) {
                throw new IllegalArgumentException("File failed antivirus scan.");
            }
        };
        ReflectionTestUtils.setField(service, "clamAvScanService", virusClamAv);

        MockMultipartFile file = createMdFile("# Virus file content");

        // Act & Assert
        assertThatThrownBy(() ->
                service.create("Virus Doc", file, 1, "ClubInternal", 42, "Admin", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("antivirus");

        // Không lưu DB, không bắn event
        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("TC2-06: ViceLeader gửi visibilityScope=Public + clubID=JS Club → bị ép về ClubInternal + clubID token")
    void tc2_06_viceLeaderForcedToOwnClub() {
        // Arrange
        MockMultipartFile file = createMdFile("# ViceLeader doc");
        Integer viceLeaderClubId = 5; // CLB thật của ViceLeader (từ token)
        Integer requestedClubId = 99; // CLB khác (client gửi lên, phải bị bỏ qua)

        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> {
                    KnowledgeArchive a = inv.getArgument(0);
                    a.setArchiveID(1);
                    return a;
                });

        // Act — ViceLeader gửi clubID=99 (JS Club) + Public
        KnowledgeArchive result = service.create(
                "ViceLeader Doc", file, requestedClubId,
                "Public", 10, "Student", "ViceLeader", viceLeaderClubId);

        // Assert — bị ép về ClubInternal + clubID=5 (token)
        assertThat(result.getClubID()).isEqualTo(viceLeaderClubId);
        assertThat(result.getVisibilityScope()).isEqualTo("ClubInternal");
    }

    @Test
    @DisplayName("TC2-07: ICPDP tạo tài liệu Public → thành công, clubID vẫn phải set")
    void tc2_07_icpdpCanCreatePublic() {
        // Arrange
        MockMultipartFile file = createMdFile("# ICPDP Public doc");
        Integer selectedClubId = 3;

        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> {
                    KnowledgeArchive a = inv.getArgument(0);
                    a.setArchiveID(2);
                    return a;
                });

        // Act — ICPDP (userClubRole=null) tạo Public
        KnowledgeArchive result = service.create(
                "ICPDP Public Doc", file, selectedClubId,
                "Public", 1, "ICPDP", null, null);

        // Assert — Public thành công, clubID = 3 (selected)
        assertThat(result.getVisibilityScope()).isEqualTo("Public");
        assertThat(result.getClubID()).isEqualTo(selectedClubId);
    }

    @Test
    @DisplayName("TC2-07 (variant): ICPDP mà không chọn clubID → bị chặn")
    void tc2_07_icpdpWithoutClubIdIsRejected() {
        MockMultipartFile file = createMdFile("# Missing club");

        assertThatThrownBy(() ->
                service.create("No Club", file, null,
                        "Public", 1, "ICPDP", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("clubID");
    }

    @ParameterizedTest
    @ValueSource(strings = {"Student", "Member"})
    @DisplayName("TC2-12: Student/Member create Public + clubID -> 403, no save, no event")
    void createRejectsRegularStudentOrMember(String roleName) {
        MockMultipartFile file = createMdFile("# Regular user doc");

        assertThatThrownBy(() ->
                service.create("Student Public", file, 1, "Public",
                        12, roleName, null, null))
                .isInstanceOf(AccessDeniedException.class);

        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Create: ClubManager không được tạo Knowledge Archive")
    void createRejectsClubManager() {
        MockMultipartFile file = createMdFile("# ClubManager doc");

        assertThatThrownBy(() ->
                service.create("ClubManager Doc", file, 1, "ClubInternal",
                        13, "Student", "ClubManager", 1))
                .isInstanceOf(AccessDeniedException.class);

        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Create: Admin tạo Public thành công")
    void createAllowsAdminPublicArchive() {
        MockMultipartFile file = createMdFile("# Admin Public doc");
        Integer selectedClubId = 7;

        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> {
                    KnowledgeArchive a = inv.getArgument(0);
                    a.setArchiveID(3);
                    return a;
                });

        KnowledgeArchive result = service.create(
                "Admin Public Doc", file, selectedClubId,
                "Public", 1, "Admin", null, null);

        assertThat(result.getVisibilityScope()).isEqualTo("Public");
        assertThat(result.getClubID()).isEqualTo(selectedClubId);
    }

    @Test
    @DisplayName("TC2-17: Invalid visibilityScope -> clear IllegalArgumentException")
    void createRejectsInvalidVisibilityScope() {
        MockMultipartFile file = createMdFile("# Invalid scope doc");

        assertThatThrownBy(() ->
                service.create("Invalid Scope", file, 1,
                        "CampusWide", 1, "Admin", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("visibilityScope")
                .hasMessageContaining("Public")
                .hasMessageContaining("ClubInternal");

        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("TC2-08: Tạo tài liệu → DB lưu indexingStatus=Pending, event CREATE được bắn")
    void tc2_08_createSetsStatusAndPublishesEvent() {
        // Arrange
        MockMultipartFile file = createMdFile("# Knowledge content\n\nSome useful info.");

        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> {
                    KnowledgeArchive a = inv.getArgument(0);
                    a.setArchiveID(42);
                    return a;
                });

        // Act
        KnowledgeArchive result = service.create(
                "Test Doc", file, 1, "ClubInternal", 10, "Admin", null, null);

        // Assert — indexingStatus = Pending
        assertThat(result.getIndexingStatus()).isEqualTo("Pending");
        assertThat(result.getSourceFormat()).isEqualTo("MD");

        // Assert — event CREATE được bắn
        var captor = org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(KnowledgeArchiveIndexedEvent.class);
        KnowledgeArchiveIndexedEvent capturedEvent = (KnowledgeArchiveIndexedEvent) captor.getValue();
        assertThat(capturedEvent.archiveID()).isEqualTo(42);
        assertThat(capturedEvent.operation()).isEqualTo("CREATE");
    }

    @Test
    @DisplayName("TC2-09: POST /reindex khi Failed → Pending + event UPDATE")
    void tc2_09_reindexFromFailedToPending() {
        // Arrange
        KnowledgeArchive failedArchive = new KnowledgeArchive();
        failedArchive.setArchiveID(7);
        failedArchive.setIndexingStatus("Failed");
        failedArchive.setIsDeleted(false);

        when(repository.findByArchiveIDAndIsDeletedFalse(7))
                .thenReturn(Optional.of(failedArchive));
        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // Act
        service.reindex(7);

        // Assert
        assertThat(failedArchive.getIndexingStatus()).isEqualTo("Pending");

        var captor = org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(KnowledgeArchiveIndexedEvent.class);
        KnowledgeArchiveIndexedEvent capturedEvent = (KnowledgeArchiveIndexedEvent) captor.getValue();
        assertThat(capturedEvent.archiveID()).isEqualTo(7);
        assertThat(capturedEvent.operation()).isEqualTo("UPDATE");
    }

    @Test
    @DisplayName("TC2-09 (variant): Reindex khi đang Completed → bị chặn")
    void tc2_09_reindexNonFailedIsRejected() {
        KnowledgeArchive completedArchive = new KnowledgeArchive();
        completedArchive.setArchiveID(8);
        completedArchive.setIndexingStatus("Completed");
        completedArchive.setIsDeleted(false);

        when(repository.findByArchiveIDAndIsDeletedFalse(8))
                .thenReturn(Optional.of(completedArchive));

        assertThatThrownBy(() -> service.reindex(8))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Failed");
    }

    @Test
    @DisplayName("Delete archive -> set isDeleted=true, save entity, publish event DELETE")
    void deleteMarksArchiveDeletedAndPublishesDeleteEvent() {
        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(9);
        archive.setIsDeleted(false);

        when(repository.findByArchiveIDAndIsDeletedFalse(9)).thenReturn(Optional.of(archive));

        service.delete(9);

        assertThat(archive.getIsDeleted()).isTrue();
        verify(repository).save(archive);

        var captor = org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(KnowledgeArchiveIndexedEvent.class);
        KnowledgeArchiveIndexedEvent event = (KnowledgeArchiveIndexedEvent) captor.getValue();
        assertThat(event.archiveID()).isEqualTo(9);
        assertThat(event.operation()).isEqualTo("DELETE");
    }
    @Test
    @DisplayName("TC2-10: Upload PDF text layer -> parse Markdown, sourceFormat=PDF, Pending, event CREATE")
    void tc2_10_uploadTextPdfParsesAndPublishesCreateEvent() {
        MockMultipartFile file = createPdfFile(
                "text-layer.pdf",
                createTextPdf("Knowledge archive PDF fixture text")
        );

        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> {
                    KnowledgeArchive a = inv.getArgument(0);
                    a.setArchiveID(60);
                    return a;
                });

        KnowledgeArchive result = service.create(
                "PDF Doc", file, 1, "ClubInternal", 10, "Admin", null, null);

        assertThat(result.getSourceFormat()).isEqualTo("PDF");
        assertThat(result.getContent()).contains("Knowledge archive PDF fixture text");
        assertThat(result.getIndexingStatus()).isEqualTo("Pending");

        var captor = org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(KnowledgeArchiveIndexedEvent.class);
        KnowledgeArchiveIndexedEvent capturedEvent = (KnowledgeArchiveIndexedEvent) captor.getValue();
        assertThat(capturedEvent.archiveID()).isEqualTo(60);
        assertThat(capturedEvent.operation()).isEqualTo("CREATE");
    }

    @Test
    @DisplayName("TC2-11: Upload PDF scan/không text layer -> lỗi rõ ràng, không lưu DB")
    void tc2_11_uploadBlankPdfIsRejectedWithoutSaving() {
        MockMultipartFile file = createPdfFile("blank-scan.pdf", createBlankPdf());

        assertThatThrownBy(() ->
                service.create("Blank PDF", file, 1, "ClubInternal", 10, "Admin", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PDF")
                .hasMessageContaining("text layer");

        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("TC2-08 (variant): TXT file → sourceFormat='TXT'")
    void createTxtSetsCorrectFormat() {
        MockMultipartFile file = createTxtFile("Plain text content for knowledge base.");

        when(repository.save(any(KnowledgeArchive.class)))
                .thenAnswer(inv -> {
                    KnowledgeArchive a = inv.getArgument(0);
                    a.setArchiveID(50);
                    return a;
                });

        KnowledgeArchive result = service.create(
                "TXT Doc", file, 1, "ClubInternal", 10, "Admin", null, null);

        assertThat(result.getSourceFormat()).isEqualTo("TXT");
    }

    private byte[] createTextPdf(String text) {
        return createPdfWithPageContent("BT /F1 18 Tf 72 720 Td (" + escapePdfText(text) + ") Tj ET\n");
    }

    private byte[] createBlankPdf() {
        return createPdfWithPageContent("");
    }

    private byte[] createPdfWithPageContent(String streamContent) {
        StringBuilder pdf = new StringBuilder();
        int[] offsets = new int[6];

        pdf.append("%PDF-1.4\n");
        appendPdfObject(pdf, offsets, 1, "<< /Type /Catalog /Pages 2 0 R >>\n");
        appendPdfObject(pdf, offsets, 2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n");
        appendPdfObject(pdf, offsets, 3,
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                        + "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n");
        appendPdfObject(pdf, offsets, 4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
        appendPdfObject(pdf, offsets, 5,
                "<< /Length " + streamContent.getBytes(StandardCharsets.US_ASCII).length + " >>\n"
                        + "stream\n"
                        + streamContent
                        + "endstream\n");

        int xrefOffset = pdf.length();
        pdf.append("xref\n");
        pdf.append("0 6\n");
        pdf.append("0000000000 65535 f \n");
        for (int i = 1; i < offsets.length; i++) {
            pdf.append(String.format("%010d 00000 n \n", offsets[i]));
        }
        pdf.append("trailer\n");
        pdf.append("<< /Size 6 /Root 1 0 R >>\n");
        pdf.append("startxref\n");
        pdf.append(xrefOffset).append('\n');
        pdf.append("%%EOF\n");

        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private void appendPdfObject(StringBuilder pdf, int[] offsets, int objectNumber, String body) {
        offsets[objectNumber] = pdf.length();
        pdf.append(objectNumber).append(" 0 obj\n");
        pdf.append(body);
        pdf.append("endobj\n");
    }

    private String escapePdfText(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");
    }
}
