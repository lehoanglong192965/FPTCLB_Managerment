package com.fptu.fcms.repository;

import com.fptu.fcms.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SystemConfigRepository
        extends JpaRepository<SystemConfig, Integer> {

    // Tìm cấu hình theo key
    Optional<SystemConfig> findByConfigKey(
            String configKey
    );
}