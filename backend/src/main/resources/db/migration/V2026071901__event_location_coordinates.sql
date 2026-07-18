-- Toạ độ bản đồ cho địa điểm sự kiện (Leaflet / OpenStreetMap).
-- Cột nullable để không ảnh hưởng dữ liệu sự kiện cũ chưa có toạ độ.
IF COL_LENGTH('dbo.Event', 'latitude') IS NULL
BEGIN
    ALTER TABLE dbo.Event ADD latitude FLOAT NULL;
END;

IF COL_LENGTH('dbo.Event', 'longitude') IS NULL
BEGIN
    ALTER TABLE dbo.Event ADD longitude FLOAT NULL;
END;
