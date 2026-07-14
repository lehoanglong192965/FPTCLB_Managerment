-- ============================================================================
-- PATCH: Knowledge Archive & AI Chatbot
-- Áp dụng SAU khi đã chạy schema gốc (SQLQuery__3_.sql).
-- Idempotent: chạy lại nhiều lần không lỗi, không mất dữ liệu.
-- Owner: DEV1
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) KnowledgeArchive: thêm visibilityScope + indexingStatus
--    - clubID GIỮ NGUYÊN NOT NULL (không đổi). Tài liệu Public vẫn phải gắn
--      1 CLB sở hữu/soạn thảo; việc lọc hiển thị dựa vào visibilityScope,
--      KHÔNG dựa vào clubID có NULL hay không. Do đó FE bắt buộc luôn hiện
--      "Select Club" cho ADMIN/ICPDP kể cả khi chọn scope = Public.
-- ----------------------------------------------------------------------------
IF COL_LENGTH('dbo.KnowledgeArchive', 'visibilityScope') IS NULL
BEGIN
    ALTER TABLE dbo.KnowledgeArchive
        ADD visibilityScope VARCHAR(20) NOT NULL
            CONSTRAINT DF_KnowledgeArchive_VisibilityScope DEFAULT 'ClubInternal';
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KnowledgeArchive_VisibilityScope'
      AND parent_object_id = OBJECT_ID('dbo.KnowledgeArchive')
)
BEGIN
    ALTER TABLE dbo.KnowledgeArchive WITH CHECK ADD CONSTRAINT CK_KnowledgeArchive_VisibilityScope
        CHECK (visibilityScope IN ('Public', 'ClubInternal'));
END;
GO

IF COL_LENGTH('dbo.KnowledgeArchive', 'indexingStatus') IS NULL
BEGIN
    ALTER TABLE dbo.KnowledgeArchive
        ADD indexingStatus VARCHAR(20) NOT NULL
            CONSTRAINT DF_KnowledgeArchive_IndexingStatus DEFAULT 'Pending';
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KnowledgeArchive_IndexingStatus'
      AND parent_object_id = OBJECT_ID('dbo.KnowledgeArchive')
)
BEGIN
    ALTER TABLE dbo.KnowledgeArchive WITH CHECK ADD CONSTRAINT CK_KnowledgeArchive_IndexingStatus
        CHECK (indexingStatus IN ('Pending', 'Processing', 'Success', 'Failed'));
END;
GO

-- ----------------------------------------------------------------------------
-- 1b) [MỚI - bổ sung scope PDF] sourceFormat — phân biệt tài liệu gốc là
--     MD / TXT / PDF. Dùng cho hiển thị icon ở FE và quyết định có cần
--     chạy lại qua opendataloader-pdf khi reindex hay không.
--     Nội dung trích xuất từ PDF (qua opendataloader-pdf, output Markdown)
--     vẫn được lưu vào cột content/KnowledgeChunk y hệt tài liệu .md thường —
--     KHÔNG cần thêm cột toạ độ/trang, giữ đơn giản (xem DEV2-Plan mục 4.2).
-- ----------------------------------------------------------------------------
IF COL_LENGTH('dbo.KnowledgeArchive', 'sourceFormat') IS NULL
BEGIN
    ALTER TABLE dbo.KnowledgeArchive
        ADD sourceFormat VARCHAR(10) NOT NULL
            CONSTRAINT DF_KnowledgeArchive_SourceFormat DEFAULT 'MD';
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KnowledgeArchive_SourceFormat'
      AND parent_object_id = OBJECT_ID('dbo.KnowledgeArchive')
)
BEGIN
    ALTER TABLE dbo.KnowledgeArchive WITH CHECK ADD CONSTRAINT CK_KnowledgeArchive_SourceFormat
        CHECK (sourceFormat IN ('MD', 'TXT', 'PDF'));
END;
GO

-- ----------------------------------------------------------------------------
-- 2) KnowledgeChunk (bảng mới) — phục vụ RAG chunking + vector similarity.
--    embeddingVector lưu dạng JSON string "[0.012,-0.034,...]" (768 phần tử).
--    Chọn NVARCHAR(MAX) thay vì VARBINARY/VECTOR type vì:
--      - Toàn bộ so khớp Dot Product được tính trong RAM (Java), không cần
--        DB-side vector index / native VECTOR type.
--      - Đơn giản parse bằng Jackson, không cần thêm thư viện encode nhị phân.
--    Nếu sau này cần scale lớn hơn (>vài chục nghìn chunk), cân nhắc đổi sang
--    VARBINARY(MAX) (pack float[] nhị phân) để giảm dung lượng + tốc độ parse.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.KnowledgeChunk', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.KnowledgeChunk (
        chunkID         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_KnowledgeChunk PRIMARY KEY,
        archiveID       INT NOT NULL,
        chunkIndex      INT NOT NULL,
        chunkText       NVARCHAR(MAX) NOT NULL,
        embeddingVector NVARCHAR(MAX) NOT NULL,
        createdAt       DATETIME2 NOT NULL CONSTRAINT DF_KnowledgeChunk_CreatedAt DEFAULT SYSDATETIME(),
        isDeleted       BIT NOT NULL CONSTRAINT DF_KnowledgeChunk_IsDeleted DEFAULT 0,
        CONSTRAINT FK_KnowledgeChunk_Archive FOREIGN KEY (archiveID)
            REFERENCES dbo.KnowledgeArchive(archiveID)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_KnowledgeChunk_ArchiveID'
      AND object_id = OBJECT_ID('dbo.KnowledgeChunk')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_KnowledgeChunk_ArchiveID
        ON dbo.KnowledgeChunk(archiveID) WHERE isDeleted = 0;
END;
GO

-- ----------------------------------------------------------------------------
-- 3) AIChatAuditLog: thêm status (Success/Fallback) + citationsJson (audit trail)
--    Cột này BỊ THIẾU trong đặc tả gốc (TC1-01 chỉ ví dụ cột mới cho
--    KnowledgeArchive, quên nêu AIChatAuditLog) — nhưng TC3-08 lại yêu cầu
--    lưu status='Fallback', nên bắt buộc phải có ở đây.
-- ----------------------------------------------------------------------------
IF COL_LENGTH('dbo.AIChatAuditLog', 'status') IS NULL
BEGIN
    ALTER TABLE dbo.AIChatAuditLog
        ADD status VARCHAR(20) NOT NULL
            CONSTRAINT DF_AIChatAuditLog_Status DEFAULT 'Success';
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_AIChatAuditLog_Status'
      AND parent_object_id = OBJECT_ID('dbo.AIChatAuditLog')
)
BEGIN
    ALTER TABLE dbo.AIChatAuditLog WITH CHECK ADD CONSTRAINT CK_AIChatAuditLog_Status
        CHECK (status IN ('Success', 'Fallback'));
END;
GO

IF COL_LENGTH('dbo.AIChatAuditLog', 'citationsJson') IS NULL
BEGIN
    ALTER TABLE dbo.AIChatAuditLog ADD citationsJson NVARCHAR(MAX) NULL;
END;
GO

-- ----------------------------------------------------------------------------
-- 4) SystemConfig: KHÔNG tạo key 'RAG_CONFIDENCE_THRESHOLD' mới.
--    Key 'AI_CONFIDENCE_THRESHOLD' = '0.70' ĐÃ seed sẵn trong schema gốc —
--    dùng lại key này cho toàn bộ code RAG, tránh 2 key trùng ý nghĩa.
--    Chỉ thêm 'RAG_FALLBACK_MESSAGE' vì key này thật sự chưa tồn tại.
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfig WHERE configKey = 'RAG_FALLBACK_MESSAGE')
BEGIN
    INSERT INTO dbo.SystemConfig (configKey, configValue, updatedBy)
    VALUES (
        'RAG_FALLBACK_MESSAGE',
        N'Xin lỗi, mình chưa tìm thấy thông tin phù hợp trong kho tri thức để trả lời câu hỏi này. Bạn vui lòng liên hệ ICPDP hoặc Ban chủ nhiệm CLB để được hỗ trợ trực tiếp.',
        1
    );
END;
GO

-- ----------------------------------------------------------------------------
-- 5) KHÔNG tạo bảng LeaderboardCache trong patch này.
--    Bảng này không thuộc phạm vi Knowledge Archive / AI Chatbot — bị nhắc
--    nhầm trong TC1-01 gốc (có thể copy-paste từ tài liệu của tính năng
--    ranking/leaderboard, vốn đã có MemberRankingSnapshot riêng).
-- ----------------------------------------------------------------------------

-- ============================================================================
-- END PATCH
-- ============================================================================
