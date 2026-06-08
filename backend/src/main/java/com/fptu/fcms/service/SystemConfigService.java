package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.SystemConfigRequest;

public interface SystemConfigService {

    // Lấy tất cả cấu hình hệ thống
    Object getAllConfigs();

    // Cập nhật cấu hình theo key
    Object updateConfig(
            String configKey,
            SystemConfigRequest request
    );
}