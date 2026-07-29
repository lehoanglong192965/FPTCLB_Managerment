-- Migration: Mốc vô hiệu hoá JWT theo từng tài khoản (P1-BE-2)
-- Version: V2026072901
--
-- Access token mang sẵn claim roleID/roleName/clubRole/clubId và sống 24h, nên khi
-- quyền thay đổi (đổi Leader, khai trừ member, Admin đổi role) token cũ vẫn giữ
-- quyền cũ cho tới lúc hết hạn. Cột này ghi lại thời điểm quyền đổi; AccountStatusFilter
-- từ chối mọi token có iat <= tokenInvalidatedAt, buộc client gọi /auth/refresh để lấy
-- claim mới. Dùng lại đúng query mà filter vốn đã chạy nên không tốn thêm SELECT.

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UserAccount') AND name = 'tokenInvalidatedAt')
BEGIN
    ALTER TABLE dbo.UserAccount ADD tokenInvalidatedAt DATETIME2 NULL;
END
