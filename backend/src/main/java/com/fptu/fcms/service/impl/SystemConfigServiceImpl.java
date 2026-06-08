package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.SystemConfigRequest;
import com.fptu.fcms.entity.SystemConfig;
import com.fptu.fcms.repository.SystemConfigRepository;
import com.fptu.fcms.service.SystemConfigService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SystemConfigServiceImpl
        implements SystemConfigService {

    private final SystemConfigRepository
            systemConfigRepository;

    // Lấy toàn bộ cấu hình hệ thống
    @Override
    public Object getAllConfigs() {

        return systemConfigRepository.findAll();
    }

    // Cập nhật giá trị cấu hình theo configKey
    @Override
    public Object updateConfig(
            String configKey,
            SystemConfigRequest request
    ) {

        // Tìm cấu hình theo key
        SystemConfig config =
                systemConfigRepository
                        .findByConfigKey(configKey)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Config not found"
                                ));

        // Cập nhật giá trị mới
        config.setConfigValue(
                request.getConfigValue()
        );

        // Lưu cấu hình sau khi cập nhật
        return systemConfigRepository.save(config);
    }
}