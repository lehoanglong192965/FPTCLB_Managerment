package com.fptu.fcms.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface UploadService {
    Map<String, String> storeFile(MultipartFile file);
    Resource loadFileAsResource(String filename);
}
