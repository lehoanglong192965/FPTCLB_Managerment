package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.enums.ContributionBatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContributionBatchRepository extends JpaRepository<ContributionBatch, Integer> {
    /**
     * Luôn dùng bản findFirst...OrderByCreatedAtDesc này để tra batch theo event.
     *
     * Cố tình KHÔNG có findByEventIDAndIsDeletedFalse: nó trả Optional nên Spring Data ném
     * IncorrectResultSizeDataAccessException (HTTP 500) ngay khi một event có 2 batch active.
     * Unique index UX_ContributionBatch_Event_Active (V2026072902) đã chặn từ DB, nhưng giữ
     * truy vấn an toàn ở đây để dữ liệu cũ không làm sập luồng đóng sự kiện.
     */
    Optional<ContributionBatch> findFirstByEventIDAndIsDeletedFalseOrderByCreatedAtDesc(Integer eventID);

    Optional<ContributionBatch> findByBatchIDAndIsDeletedFalse(Integer batchID);

    List<ContributionBatch> findByClubIDAndStatusAndIsDeletedFalse(Integer clubID, ContributionBatchStatus status);

    List<ContributionBatch> findByStatusAndAppealClosesAtBeforeAndIsDeletedFalse(
            ContributionBatchStatus status,
            LocalDateTime appealClosesAt
    );

    List<ContributionBatch> findByStatusAndIsDeletedFalse(ContributionBatchStatus status);
}
