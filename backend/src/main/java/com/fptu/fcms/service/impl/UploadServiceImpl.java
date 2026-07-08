package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.UploadService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class UploadServiceImpl implements UploadService {

    private final Path fileStorageLocation;
    private final Path reportStorageLocation;

    public UploadServiceImpl(
            @Value("${app.uploads.storage-dir:uploads}") String uploadsStorageDir,
            @Value("${app.reports.storage-dir:reports}") String reportsStorageDir
    ) {
        this.fileStorageLocation = Paths.get(uploadsStorageDir).toAbsolutePath().normalize();
        this.reportStorageLocation = Paths.get(reportsStorageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            Files.createDirectories(this.reportStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public Map<String, String> storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file để upload.");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/jpg"))) {
            throw new IllegalArgumentException("Chỉ hỗ trợ file ảnh định dạng JPG hoặc PNG.");
        }

        try {
            // Generate a unique file name based on content type, preventing extension spoofing
            String fileExtension = ".jpg";
            if ("image/png".equals(contentType)) {
                fileExtension = ".png";
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // Copy file to target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/uploads/" + fileName;
            return Map.of(
                    "filename", fileName,
                    "url", fileUrl
            );
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu file: " + ex.getMessage(), ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String filename) {
        try {
            if (!StringUtils.hasText(filename)) {
                throw new IllegalArgumentException("Invalid file name.");
            }

            Resource uploadResource = loadFromLocation(this.fileStorageLocation, filename);
            if (uploadResource.exists() && uploadResource.isReadable()) {
                return uploadResource;
            }

            Resource reportResource = loadFromLocation(this.reportStorageLocation, filename);
            if (reportResource.exists() && reportResource.isReadable()) {
                return reportResource;
            }

            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            
            // Prevent Path Traversal (LFI)
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Cảnh báo bảo mật: Phát hiện nỗ lực Path Traversal!");
            }
            
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return resource;
            } else {
                throw new IllegalArgumentException("Không tìm thấy file: " + filename);
            }
        } catch (Exception ex) {
            throw new RuntimeException("Không thể đọc file: " + filename, ex);
        }
    }

    private Resource loadFromLocation(Path storageLocation, String filename) throws IOException {
        Path filePath = storageLocation.resolve(filename).normalize();

        // Prevent Path Traversal (LFI)
        if (!filePath.startsWith(storageLocation)) {
            throw new SecurityException("Path traversal attempt detected.");
        }

        return new UrlResource(filePath.toUri());
    }
}
