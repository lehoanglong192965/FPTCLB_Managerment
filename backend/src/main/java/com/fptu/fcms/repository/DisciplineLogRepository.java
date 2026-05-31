package com.fptu.fcms.repository;

import com.fptu.fcms.entity.DisciplineLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisciplineLogRepository extends JpaRepository<DisciplineLog, Integer> {

    /**
     * [BR-L01] Kiểm tra sinh viên có đang bị kỷ luật Active không.
     * Dùng để chặn bổ nhiệm Leader / ViceLeader.
     */
    boolean existsByUserIDAndDisciplineStatus(Integer userID, String disciplineStatus);
}
