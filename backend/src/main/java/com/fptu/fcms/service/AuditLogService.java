package com.fptu.fcms.service;

public interface AuditLogService {
    void record(Integer actorId,
                String tableName,
                Integer recordId,
                String actionType,
                Object beforeState,
                Object afterState,
                String reason);

    void recordWithRefs(Integer actorId,
                        String tableName,
                        Integer recordId,
                        String actionType,
                        Object beforeState,
                        Object afterState,
                        Integer eventId,
                        Integer registrationId,
                        Integer attendanceRecordId,
                        String reason);
}
