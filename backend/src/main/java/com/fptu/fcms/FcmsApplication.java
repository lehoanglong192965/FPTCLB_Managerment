package com.fptu.fcms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableCaching
@EnableRetry
public class FcmsApplication {

    public static void main(String[] args) {
        loadLocalDotEnv();
        SpringApplication.run(FcmsApplication.class, args);
    }

    private static void loadLocalDotEnv() {
        Path envPath = Paths.get(".env");
        if (!Files.exists(envPath)) {
            envPath = Paths.get("backend", ".env");
        }
        if (!Files.exists(envPath)) {
            return;
        }

        try {
            for (String rawLine : Files.readAllLines(envPath, StandardCharsets.UTF_8)) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int separatorIndex = line.indexOf('=');
                if (separatorIndex <= 0) {
                    continue;
                }

                String key = line.substring(0, separatorIndex).trim();
                String value = stripOptionalQuotes(line.substring(separatorIndex + 1).trim());
                setPropertyIfMissing(key, value);
                setPropertyIfMissing(toEnvironmentAlias(key), value);
            }
        } catch (IOException ignored) {
            // Keep startup behavior unchanged when the optional local .env cannot be read.
        }
    }

    private static void setPropertyIfMissing(String key, String value) {
        if (System.getProperty(key) == null && System.getenv(key) == null) {
            System.setProperty(key, value);
        }
    }

    private static String toEnvironmentAlias(String key) {
        return key.toUpperCase()
                .replace('.', '_')
                .replace('-', '_');
    }

    private static String stripOptionalQuotes(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
