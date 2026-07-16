-- Repair the feature-owned fallback config after V2026070503 was applied to
-- shared baseline schemas where SystemConfig.configValue is non-Unicode.
-- Existing custom fallback messages are preserved; only the known corrupted
-- seeded value is restored.

IF OBJECT_ID(N'dbo.SystemConfig', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SystemConfig', N'configValue') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns column_info
       JOIN sys.types type_info ON type_info.user_type_id = column_info.user_type_id
       WHERE column_info.object_id = OBJECT_ID(N'dbo.SystemConfig')
         AND column_info.name = N'configValue'
         AND type_info.name <> N'nvarchar'
   )
BEGIN
    ALTER TABLE dbo.SystemConfig ALTER COLUMN configValue NVARCHAR(500) NOT NULL;
END;
GO

IF EXISTS (
    SELECT 1
    FROM dbo.SystemConfig
    WHERE configKey = 'RAG_FALLBACK_MESSAGE'
      AND configValue LIKE N'Xin l?i,%'
)
BEGIN
    UPDATE dbo.SystemConfig
    SET configValue = N'Xin lỗi, mình chưa tìm thấy thông tin phù hợp trong kho tri thức để trả lời câu hỏi này. Bạn vui lòng liên hệ ICPDP hoặc Ban chủ nhiệm CLB để được hỗ trợ trực tiếp.'
    WHERE configKey = 'RAG_FALLBACK_MESSAGE'
      AND configValue LIKE N'Xin l?i,%';
END;
GO
