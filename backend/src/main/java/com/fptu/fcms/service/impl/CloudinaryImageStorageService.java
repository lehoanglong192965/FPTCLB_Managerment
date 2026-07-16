package com.fptu.fcms.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.fptu.fcms.config.CloudinaryProperties;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.exception.ImageDeleteException;
import com.fptu.fcms.exception.ImageUploadException;
import com.fptu.fcms.exception.InvalidImageException;
import com.fptu.fcms.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryImageStorageService implements ImageStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    @Override
    public CloudinaryUploadResult uploadImage(MultipartFile file, String folder) {
        validateCloudinaryConfiguration();
        validateImage(file);

        try {
            Map<?, ?> uploaded = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image",
                            "unique_filename", true,
                            "overwrite", false
                    )
            );
            CloudinaryUploadResult result = toUploadResult(uploaded);
            log.info("Uploaded image to Cloudinary. publicId={}, bytes={}", result.getPublicId(), result.getBytes());
            return result;
        } catch (IOException ex) {
            log.warn("Could not read image bytes before Cloudinary upload. filename={}", file.getOriginalFilename(), ex);
            throw new ImageUploadException("Cannot read image file for upload.", ex);
        } catch (RuntimeException ex) {
            log.warn("Cloudinary image upload failed. filename={}", file.getOriginalFilename(), ex);
            throw new ImageUploadException("Upload Cloudinary failed.", ex);
        }
    }

    @Override
    public List<CloudinaryUploadResult> uploadImages(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) {
            throw new InvalidImageException("Please select at least one image file.");
        }

        List<CloudinaryUploadResult> uploaded = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                uploaded.add(uploadImage(file, folder));
            }
            return uploaded;
        } catch (RuntimeException ex) {
            rollbackUploadedImages(uploaded);
            throw ex;
        }
    }

    @Override
    public void deleteImage(String publicId) {
        if (!StringUtils.hasText(publicId)) {
            return;
        }
        validateCloudinaryConfiguration();

        try {
            Map<?, ?> result = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", "image")
            );
            log.info("Deleted image from Cloudinary. publicId={}, result={}", publicId, result.get("result"));
        } catch (IOException ex) {
            log.warn("Cloudinary image delete failed. publicId={}", publicId, ex);
            throw new ImageDeleteException("Delete Cloudinary image failed.", ex);
        } catch (RuntimeException ex) {
            log.warn("Cloudinary image delete failed. publicId={}", publicId, ex);
            throw new ImageDeleteException("Delete Cloudinary image failed.", ex);
        }
    }

    @Override
    public CloudinaryUploadResult replaceImage(MultipartFile newFile, String oldPublicId, String folder) {
        CloudinaryUploadResult uploaded = uploadImage(newFile, folder);
        try {
            deleteImage(oldPublicId);
            return uploaded;
        } catch (RuntimeException ex) {
            deleteImage(uploaded.getPublicId());
            throw ex;
        }
    }

    private void validateCloudinaryConfiguration() {
        if (!properties.isConfigured()) {
            throw new ImageUploadException("Cloudinary is not configured.");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null) {
            throw new InvalidImageException("Image file is required.");
        }
        if (file.isEmpty()) {
            throw new InvalidImageException("Image file must not be empty.");
        }
        if (file.getSize() > properties.getMaxImageSizeBytes()) {
            throw new InvalidImageException("Image file exceeds the allowed size.");
        }

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType)
                || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidImageException("Only JPG, PNG, and WebP image files are supported.");
        }

        String filename = file.getOriginalFilename();
        String extension = StringUtils.getFilenameExtension(filename);
        if (StringUtils.hasText(extension)
                && !ALLOWED_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT))) {
            throw new InvalidImageException("Image extension is not supported.");
        }
    }

    private CloudinaryUploadResult toUploadResult(Map<?, ?> uploaded) {
        return CloudinaryUploadResult.builder()
                .secureUrl(asString(uploaded.get("secure_url")))
                .publicId(asString(uploaded.get("public_id")))
                .resourceType(asString(uploaded.get("resource_type")))
                .format(asString(uploaded.get("format")))
                .width(asInteger(uploaded.get("width")))
                .height(asInteger(uploaded.get("height")))
                .bytes(asLong(uploaded.get("bytes")))
                .build();
    }

    private void rollbackUploadedImages(List<CloudinaryUploadResult> uploaded) {
        for (CloudinaryUploadResult result : uploaded) {
            try {
                deleteImage(result.getPublicId());
                log.info("Rolled back uploaded image. publicId={}", result.getPublicId());
            } catch (RuntimeException cleanupError) {
                log.warn("Could not rollback uploaded image. publicId={}", result.getPublicId(), cleanupError);
            }
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer asInteger(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private Long asLong(Object value) {
        return value instanceof Number number ? number.longValue() : null;
    }
}
