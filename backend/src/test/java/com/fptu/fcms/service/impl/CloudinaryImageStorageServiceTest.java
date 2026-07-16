package com.fptu.fcms.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.fptu.fcms.config.CloudinaryFolders;
import com.fptu.fcms.config.CloudinaryProperties;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.exception.InvalidImageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CloudinaryImageStorageServiceTest {

    private Cloudinary cloudinary;
    private Uploader uploader;
    private CloudinaryImageStorageService service;

    @BeforeEach
    void setUp() {
        cloudinary = mock(Cloudinary.class);
        uploader = mock(Uploader.class);

        CloudinaryProperties properties = new CloudinaryProperties();
        properties.setCloudName("demo");
        properties.setApiKey("key");
        properties.setApiSecret("secret");
        properties.setMaxImageSizeBytes(1024);

        service = new CloudinaryImageStorageService(cloudinary, properties);
    }

    @Test
    void uploadImage_withValidJpeg_returnsCloudinaryResult() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/demo/image/upload/v1/fptclb-management/clubs/logos/logo.jpg",
                "public_id", "fptclb-management/clubs/logos/logo",
                "resource_type", "image",
                "format", "jpg",
                "width", 400,
                "height", 300,
                "bytes", 512
        ));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "logo.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3}
        );

        CloudinaryUploadResult result = service.uploadImage(file, CloudinaryFolders.CLUB_LOGOS);

        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/fptclb-management/clubs/logos/logo.jpg", result.getSecureUrl());
        assertEquals("fptclb-management/clubs/logos/logo", result.getPublicId());
        assertEquals(400, result.getWidth());
        assertEquals(300, result.getHeight());
        assertEquals(512L, result.getBytes());
    }

    @Test
    void uploadImage_withNonImageFile_rejectsBeforeUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "script.txt",
                "text/plain",
                new byte[]{1, 2, 3}
        );

        assertThrows(InvalidImageException.class, () -> service.uploadImage(file, CloudinaryFolders.CLUB_LOGOS));
    }

    @Test
    void uploadImage_withOversizedFile_rejectsBeforeUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "large.png",
                "image/png",
                new byte[2048]
        );

        assertThrows(InvalidImageException.class, () -> service.uploadImage(file, CloudinaryFolders.CLUB_LOGOS));
    }
}
