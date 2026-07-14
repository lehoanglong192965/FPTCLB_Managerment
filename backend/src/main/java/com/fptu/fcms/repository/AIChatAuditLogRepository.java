package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AIChatAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AIChatAuditLogRepository extends JpaRepository<AIChatAuditLog, Integer> {
}
