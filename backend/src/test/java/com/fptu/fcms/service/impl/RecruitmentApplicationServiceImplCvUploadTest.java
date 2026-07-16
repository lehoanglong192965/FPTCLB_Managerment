package com.fptu.fcms.service.impl;

import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ClubBlacklistRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.RecruitmentApplicationRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.WithdrawLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class RecruitmentApplicationServiceImplCvUploadTest {

    @Mock private RecruitmentApplicationRepository recruitmentRepository;
    @Mock private ClubMembershipRepository membershipRepository;
    @Mock private ClubBlacklistRepository blacklistRepository;
    @Mock private SemesterRepository semesterRepository;
    @Mock private WithdrawLogRepository withdrawLogRepository;
    @Mock private ClubRepository clubRepository;
    @Mock private ClamAvScanService clamAvScanService;

    @InjectMocks
    private RecruitmentApplicationServiceImpl service;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "cvStorageDir", tempDir.toString());
    }

    @Test
    void validPdfIsScannedAndStoredWithSafeUuidName() {
        MockMultipartFile file = pdf("cv.pdf", "%PDF-1.7\nvalid cv");

        Map<String, String> result = service.uploadCv(file);

        String filename = result.get("filename");
        assertTrue(filename.matches("[0-9a-fA-F-]{36}\\.pdf"));
        assertEquals("/api/uploads/" + filename, result.get("url"));
        assertTrue(Files.exists(tempDir.resolve(filename)));
        verify(clamAvScanService).scan(file);
    }

    @Test
    void invalidPdfMagicIsRejectedBeforeVirusScan() {
        MockMultipartFile file = pdf("cv.pdf", "not-a-pdf");

        BusinessRuleException error = assertThrows(BusinessRuleException.class, () -> service.uploadCv(file));

        assertEquals("File không phải PDF hợp lệ.", error.getMessage());
        verifyNoInteractions(clamAvScanService);
    }

    @Test
    void nonPdfExtensionIsRejectedBeforeVirusScan() {
        MockMultipartFile file = pdf("cv.txt", "%PDF-1.7\nvalid bytes, wrong extension");

        assertThrows(BusinessRuleException.class, () -> service.uploadCv(file));
        verifyNoInteractions(clamAvScanService);
    }

    @Test
    void antivirusFailureDoesNotWriteFile() throws Exception {
        MockMultipartFile file = pdf("cv.pdf", "%PDF-1.7\nvirus sample");
        doThrow(new IllegalArgumentException("File failed antivirus scan."))
                .when(clamAvScanService).scan(file);

        assertThrows(IllegalArgumentException.class, () -> service.uploadCv(file));
        try (var files = Files.list(tempDir)) {
            assertFalse(files.findAny().isPresent());
        }
    }

    private MockMultipartFile pdf(String filename, String content) {
        return new MockMultipartFile("file", filename, "application/pdf", content.getBytes());
    }
}