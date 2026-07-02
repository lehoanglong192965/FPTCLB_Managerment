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

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void record(Integer actorId, String tableName, Integer recordId, String actionType, Object beforeState, Object afterState, String reason) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActorID(actorId);
        auditLog.setActionType(actionType);
        auditLog.setTableName(tableName);
        auditLog.setRecordID(recordId);
        auditLog.setOldValue(serialize(beforeState));
        auditLog.setNewValue(serialize(afterState));
        auditLog.setOverrideReason(reason);
        auditLog.setBeforeJson(serialize(beforeState));
        auditLog.setAfterJson(serialize(afterState));
        auditLog.setReason(reason);
        auditLog.setExecutedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
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
