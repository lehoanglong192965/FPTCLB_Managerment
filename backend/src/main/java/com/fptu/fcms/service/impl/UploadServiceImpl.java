package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.UploadService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
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

    public UploadServiceImpl() {
        // Store files in an "uploads" folder under the project root
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
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
            // Generate a unique file name
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
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
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
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
}
