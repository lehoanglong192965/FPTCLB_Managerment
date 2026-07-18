package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.SystemConfigRequest;
import com.fptu.fcms.entity.SystemConfig;
import com.fptu.fcms.repository.SystemConfigRepository;
import com.fptu.fcms.service.SystemConfigService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
    @CacheEvict(value = "systemConfig", key = "#configKey")
    @Transactional
    public Object updateConfig(
            String configKey,
            SystemConfigRequest request
    ) {

        // Tìm cấu hình theo key
        SystemConfig config = systemConfigRepository
                .findByConfigKey(configKey)
                .orElseGet(() -> {
                    SystemConfig created = new SystemConfig();
                    created.setConfigKey(configKey);
                    return created;
                });

        // Cập nhật giá trị mới
        config.setConfigValue(
                request.getConfigValue()
        );
        config.setUpdatedAt(LocalDateTime.now());

        // Lưu cấu hình sau khi cập nhật
        return systemConfigRepository.save(config);
    }

    // Lấy giá trị cấu hình hệ thống (như AI_CONFIDENCE_THRESHOLD, RAG_FALLBACK_MESSAGE).
    // Đầu vào: Tên khóa cấu hình (key).
    // Đầu ra: Giá trị của cấu hình được lưu trong DB, có sử dụng bộ nhớ đệm (@Cacheable) để tối ưu hiệu năng không phải truy vấn DB nhiều lần.
    @Override
    @Cacheable(value = "systemConfig", key = "#key")
    public String getConfigValue(String key) {
        return systemConfigRepository
                .findByConfigKey(key)
                .map(SystemConfig::getConfigValue)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Config not found: " + key
                        ));
    }
}
