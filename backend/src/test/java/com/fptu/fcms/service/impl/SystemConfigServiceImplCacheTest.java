package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.SystemConfigRequest;
import com.fptu.fcms.entity.SystemConfig;
import com.fptu.fcms.repository.SystemConfigRepository;
import com.fptu.fcms.service.SystemConfigService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest(classes = SystemConfigServiceImplCacheTest.TestApplication.class)
class SystemConfigServiceImplCacheTest {

    private static final String CONFIG_KEY = "TEST_CONFIG";
    private static final String OTHER_CONFIG_KEY = "OTHER_CONFIG";

    @Autowired
    private SystemConfigService systemConfigService;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private SystemConfigRepository systemConfigRepository;

    @BeforeEach
    @AfterEach
    void clearSystemConfigCache() {
        Cache cache = cacheManager.getCache("systemConfig");
        assertThat(cache).isNotNull();
        cache.clear();
    }

    @Test
    void successfulUpdateEvictsOnlyTheUpdatedConfigKey() {
        SystemConfig targetConfig = config(CONFIG_KEY, "old-value");
        SystemConfig otherConfig = config(OTHER_CONFIG_KEY, "other-value");

        when(systemConfigRepository.findByConfigKey(CONFIG_KEY))
                .thenReturn(Optional.of(targetConfig));
        when(systemConfigRepository.findByConfigKey(OTHER_CONFIG_KEY))
                .thenReturn(Optional.of(otherConfig));
        when(systemConfigRepository.save(any(SystemConfig.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(systemConfigService.getConfigValue(CONFIG_KEY)).isEqualTo("old-value");
        assertThat(systemConfigService.getConfigValue(CONFIG_KEY)).isEqualTo("old-value");
        assertThat(systemConfigService.getConfigValue(OTHER_CONFIG_KEY)).isEqualTo("other-value");
        assertThat(systemConfigService.getConfigValue(OTHER_CONFIG_KEY)).isEqualTo("other-value");

        SystemConfigRequest request = new SystemConfigRequest();
        request.setConfigValue("new-value");
        systemConfigService.updateConfig(CONFIG_KEY, request);

        assertThat(systemConfigService.getConfigValue(CONFIG_KEY)).isEqualTo("new-value");
        assertThat(systemConfigService.getConfigValue(OTHER_CONFIG_KEY)).isEqualTo("other-value");

        verify(systemConfigRepository, times(3)).findByConfigKey(CONFIG_KEY);
        verify(systemConfigRepository, times(1)).findByConfigKey(OTHER_CONFIG_KEY);
    }

    private SystemConfig config(String key, String value) {
        SystemConfig config = new SystemConfig();
        config.setConfigKey(key);
        config.setConfigValue(value);
        return config;
    }

    @SpringBootConfiguration
    @EnableCaching
    @Import(SystemConfigServiceImpl.class)
    static class TestApplication {

        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("systemConfig");
        }
    }
}
