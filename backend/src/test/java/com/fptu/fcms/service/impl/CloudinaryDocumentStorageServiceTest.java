package com.fptu.fcms.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.fptu.fcms.config.CloudinaryFolders;
import com.fptu.fcms.config.CloudinaryProperties;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CloudinaryDocumentStorageServiceTest {

    private Cloudinary cloudinary;
    private Uploader uploader;
    private CloudinaryDocumentStorageService service;

    @BeforeEach
    void setUp() {
        cloudinary = mock(Cloudinary.class);
        uploader = mock(Uploader.class);

        CloudinaryProperties properties = new CloudinaryProperties();
        properties.setCloudName("demo");
        properties.setApiKey("key");
        properties.setApiSecret("secret");
        service = new CloudinaryDocumentStorageService(cloudinary, properties);
    }

    @Test
    void uploadPdf_returnsRawCloudinaryMetadata() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/demo/raw/upload/v1/fptclb-management/reports/events/report.pdf",
                "public_id", "fptclb-management/reports/events/report.pdf",
                "resource_type", "raw",
                "bytes", 128
        ));
        MockMultipartFile file = new MockMultipartFile(
                "file", "report.pdf", "application/pdf", "%PDF-test".getBytes(StandardCharsets.US_ASCII));

        CloudinaryUploadResult result = service.uploadPdf(file, CloudinaryFolders.EVENT_REPORTS);

        assertEquals("raw", result.getResourceType());
        assertEquals("fptclb-management/reports/events/report.pdf", result.getPublicId());
        assertEquals(128L, result.getBytes());
    }

    @Test
    void deleteDocument_callsCloudinaryRawDestroy() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(any(String.class), anyMap())).thenReturn(Map.of("result", "ok"));

        service.deleteDocument("fptclb-management/reports/events/report.pdf");

        verify(uploader).destroy(any(String.class), anyMap());
    }

    @Test
    void uploadPdf_withoutConfiguration_isRejected() {
        CloudinaryProperties emptyProperties = new CloudinaryProperties();
        CloudinaryDocumentStorageService unconfigured =
                new CloudinaryDocumentStorageService(cloudinary, emptyProperties);
        MockMultipartFile file = new MockMultipartFile(
                "file", "report.pdf", "application/pdf", "%PDF-test".getBytes(StandardCharsets.US_ASCII));

        assertThrows(IllegalStateException.class,
                () -> unconfigured.uploadPdf(file, CloudinaryFolders.EVENT_REPORTS));
    }
}
