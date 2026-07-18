-- Địa điểm sự kiện có cấu trúc (theo mô hình Eventbrite/Luma):
--   venueName      = tên địa điểm / toà nhà (VD: Hội trường Beta – ĐH FPT)
--   locationDetail = chi tiết cụ thể (tầng, phòng, lối vào)
-- Đi kèm cột location (địa chỉ ghim bản đồ) và latitude/longitude đã có.
-- Các cột nullable để không ảnh hưởng dữ liệu sự kiện cũ.
IF COL_LENGTH('dbo.Event', 'venueName') IS NULL
BEGIN
    ALTER TABLE dbo.Event ADD venueName NVARCHAR(255) NULL;
END;

IF COL_LENGTH('dbo.Event', 'locationDetail') IS NULL
BEGIN
    ALTER TABLE dbo.Event ADD locationDetail NVARCHAR(500) NULL;
END;
