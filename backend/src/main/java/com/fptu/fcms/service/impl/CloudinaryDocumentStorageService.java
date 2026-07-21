package com.fptu.fcms.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.fptu.fcms.config.CloudinaryProperties;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.service.DocumentStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryDocumentStorageService implements DocumentStorageService {

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    @Override
    public CloudinaryUploadResult uploadPdf(MultipartFile file, String folder) {
        validateConfiguration();
        String originalFilename = file.getOriginalFilename();
        String extension = "pdf";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }
        String publicId = UUID.randomUUID() + "." + extension;

        try {
            Map<?, ?> uploaded = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "public_id", publicId,
                            "resource_type", "raw",
                            "overwrite", false
                    )
            );
            CloudinaryUploadResult result = CloudinaryUploadResult.builder()
                    .secureUrl(asString(uploaded.get("secure_url")))
                    .publicId(asString(uploaded.get("public_id")))
                    .resourceType(asString(uploaded.get("resource_type")))
                    .format(asString(uploaded.get("format")))
                    .bytes(asLong(uploaded.get("bytes")))
                    .build();
            log.info("Uploaded PDF to Cloudinary Raw. publicId={}, bytes={}", result.getPublicId(), result.getBytes());
            return result;
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot read PDF file for Cloudinary upload.", ex);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Cloudinary Raw upload failed.", ex);
        }
    }

    @Override
    public void deleteDocument(String publicId) {
        if (!StringUtils.hasText(publicId)) {
            return;
        }
        validateConfiguration();
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", "raw")
            );
            log.info("Deleted Cloudinary Raw document. publicId={}, result={}", publicId, result.get("result"));
        } catch (IOException | RuntimeException ex) {
            throw new IllegalStateException("Cloudinary Raw delete failed.", ex);
        }
    }

    private void validateConfiguration() {
        if (!properties.isConfigured()) {
            throw new IllegalStateException("Cloudinary is not configured.");
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Long asLong(Object value) {
        return value instanceof Number number ? number.longValue() : null;
    }
}
