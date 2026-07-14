package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AIChatAuditLog;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class AIChatAuditLogPersistenceTest {

    @Autowired
    private AIChatAuditLogRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void persistsZeroTokensWhenCallerOmitsTokenUsage() {
        AIChatAuditLog auditLog = new AIChatAuditLog();
        auditLog.setUserPrompt("Persistence-backed token default test");
        auditLog.setAiResponse("Fallback response");
        auditLog.setStatus("Fallback");
        auditLog.setCitationsJson("[]");
        auditLog.setCreatedAt(LocalDateTime.now());

        AIChatAuditLog saved = repository.saveAndFlush(auditLog);
        Integer savedId = saved.getChatLogID();
        entityManager.clear();

        AIChatAuditLog reloaded = repository.findById(savedId).orElseThrow();
        assertThat(reloaded.getTokensUsed()).isZero();
    }
}
