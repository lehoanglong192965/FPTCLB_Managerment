package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.SystemConfigRequest;
import com.fptu.fcms.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/system-configs")
@RequiredArgsConstructor
public class SystemConfigController {

    private final SystemConfigService
            systemConfigService;

    // Lấy toàn bộ cấu hình hệ thống
    @GetMapping
    public ResponseEntity<?> getAllConfigs() {

        return ResponseEntity.ok(
                systemConfigService.getAllConfigs()
        );
    }

    // Cập nhật cấu hình hệ thống
    @PutMapping("/{configKey}")
    public ResponseEntity<?> updateConfig(
            @PathVariable String configKey,
            @RequestBody SystemConfigRequest request
    ) {

        return ResponseEntity.ok(
                systemConfigService.updateConfig(
                        configKey,
                        request
                )
        );
    }
}