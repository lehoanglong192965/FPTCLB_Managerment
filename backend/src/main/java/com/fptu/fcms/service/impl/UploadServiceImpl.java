package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.dto.response.ImageUploadResponse;
import com.fptu.fcms.enums.ImageUploadPurpose;
import com.fptu.fcms.service.ImageStorageService;
import com.fptu.fcms.service.UploadService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class UploadServiceImpl implements UploadService {

    private final Path reportStorageLocation;
    private final ImageStorageService imageStorageService;

    public UploadServiceImpl(
            @Value("${app.reports.storage-dir:reports}") String reportsStorageDir,
            ImageStorageService imageStorageService
    ) {
        this.reportStorageLocation = Paths.get(reportsStorageDir).toAbsolutePath().normalize();
        this.imageStorageService = imageStorageService;
    }

    @Override
    public ImageUploadResponse uploadImage(MultipartFile file, ImageUploadPurpose purpose) {
        CloudinaryUploadResult result = imageStorageService.uploadImage(file, purpose.getFolder());
        return ImageUploadResponse.from(result);
    }

    @Override
    public Resource loadReportAsResource(String filename) {
        try {
            if (!StringUtils.hasText(filename)) {
                throw new IllegalArgumentException("Invalid file name.");
            }

            Resource reportResource = loadFromLocation(this.reportStorageLocation, filename);
            if (reportResource.exists() && reportResource.isReadable()) {
                return reportResource;
            }

            throw new IllegalArgumentException("Khong tim thay file: " + filename);
        } catch (Exception ex) {
            throw new RuntimeException("Khong the doc file: " + filename, ex);
        }
    }

    private Resource loadFromLocation(Path storageLocation, String filename) throws IOException {
        Path filePath = storageLocation.resolve(filename).normalize();

        if (!filePath.startsWith(storageLocation)) {
            throw new SecurityException("Path traversal attempt detected.");
        }

        return new UrlResource(filePath.toUri());
    }
}
