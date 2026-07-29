-- Migration: Chặn ContributionBatch trùng ở tầng DB (nguyên nhân gốc của P1-BE-5)
-- Version: V2026072902
--
-- Commit b0e0048 mới chỉ "chịu đựng" dữ liệu trùng trong ContributionBatchServiceImpl bằng
-- findFirstBy...OrderByCreatedAtDesc, còn nguồn sinh ra bản ghi trùng thì vẫn còn. Chừng nào
-- chưa có unique index, mọi truy vấn trả Optional đều có thể ném IncorrectResultSizeDataAccessException.
-- EventReport đã có UX_EventReport_Event_Active (V2026072516); bảng này thì chưa.
--
-- LƯU Ý: index lọc (WHERE isDeleted = 0) không khai báo được bằng @Index của JPA, nên cố ý
-- KHÔNG thêm vào entity ContributionBatch — @Index(unique=true) sẽ sinh ra unique index đầy đủ
-- và chặn luôn cả các bản ghi đã xoá mềm.

-- 1) Không tự quyết được: nhiều batch active cùng eventID mà đều đã có dữ liệu chấm điểm/phúc khảo.
--    Gộp chúng là quyết định nghiệp vụ, migration dừng lại để người phụ trách xử lý tay.
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;

IF EXISTS (
    SELECT 1
    FROM dbo.ContributionBatch b
    WHERE b.isDeleted = 0
      AND (EXISTS (SELECT 1 FROM dbo.EventContribution c WHERE c.batchID = b.batchID)
        OR EXISTS (SELECT 1 FROM dbo.ContributionAppeal a WHERE a.batchID = b.batchID))
    GROUP BY b.eventID
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 50001, 'Có nhiều ContributionBatch active trên cùng eventID và tất cả đều đã mang dữ liệu chấm điểm/phúc khảo. Cần gộp thủ công trước khi chạy migration này.', 1;
END

-- 2) Dọn bản trùng: ưu tiên giữ batch đã có dữ liệu, nếu đều rỗng thì giữ batch mới nhất
--    (khớp với thứ tự findFirstByEventIDAndIsDeletedFalseOrderByCreatedAtDesc mà code đang dùng).
--    Dấu ; mở đầu là bắt buộc: T-SQL yêu cầu câu lệnh ngay trước CTE phải được kết thúc.
;WITH ranked AS (
    SELECT
        b.isDeleted,
        b.updatedAt,
        ROW_NUMBER() OVER (
            PARTITION BY b.eventID
            ORDER BY
                CASE WHEN EXISTS (SELECT 1 FROM dbo.EventContribution c WHERE c.batchID = b.batchID)
                       OR EXISTS (SELECT 1 FROM dbo.ContributionAppeal a WHERE a.batchID = b.batchID)
                     THEN 0 ELSE 1 END,
                b.createdAt DESC,
                b.batchID DESC
        ) AS rn
    FROM dbo.ContributionBatch b
    WHERE b.isDeleted = 0
)
UPDATE ranked
SET isDeleted = 1,
    updatedAt = SYSDATETIME()
WHERE rn > 1;

-- 3) Từ giờ DB tự chặn: mỗi event chỉ còn đúng 1 ContributionBatch chưa xoá
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ContributionBatch_Event_Active'
      AND object_id = OBJECT_ID('dbo.ContributionBatch')
)
BEGIN
    CREATE UNIQUE INDEX UX_ContributionBatch_Event_Active
    ON dbo.ContributionBatch(eventID)
    WHERE isDeleted = 0;
END
