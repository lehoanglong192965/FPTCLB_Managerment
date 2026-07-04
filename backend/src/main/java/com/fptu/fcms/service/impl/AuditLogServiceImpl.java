package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private static final int VALUE_PREVIEW_LIMIT = 240;

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void record(Integer actorId, String tableName, Integer recordId, String actionType, Object beforeState, Object afterState, String reason) {
        String beforeJson = serialize(beforeState);
        String afterJson = serialize(afterState);

        AuditLog auditLog = new AuditLog();
        auditLog.setActorID(actorId);
        auditLog.setActionType(actionType);
        auditLog.setTableName(tableName);
        auditLog.setRecordID(recordId);
        auditLog.setOldValue(preview(beforeJson));
        auditLog.setNewValue(preview(afterJson));
        auditLog.setOverrideReason(reason == null ? "" : reason);
        auditLog.setBeforeJson(beforeJson);
        auditLog.setAfterJson(afterJson);
        auditLog.setReason(reason);
        auditLog.setExecutedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String preview(String value) {
        if (value == null || value.length() <= VALUE_PREVIEW_LIMIT) {
            return value;
        }
        return value.substring(0, VALUE_PREVIEW_LIMIT - 3) + "...";
    }

    private String serialize(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String s) {
            return s;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return String.valueOf(value);
        }
    }
}