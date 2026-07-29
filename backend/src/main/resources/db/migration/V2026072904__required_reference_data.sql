-- Required, non-personal reference data for databases bootstrapped from
-- B2026072901. Existing values are preserved; conflicting role identities
-- fail fast instead of being silently renamed.

SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;

-- System roles are a fixed application contract.
IF EXISTS (
    SELECT 1 FROM dbo.SystemRole
    WHERE roleID = 1
      AND (roleName COLLATE Latin1_General_100_BIN2 <> 'Admin' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH('Admin'))
)
    THROW 51001, 'SystemRole ID 1 must be Admin.', 1;
IF EXISTS (SELECT 1 FROM dbo.SystemRole WHERE roleName COLLATE Latin1_General_100_CI_AS = 'Admin' AND roleID <> 1)
    THROW 51002, 'SystemRole Admin already exists under another ID.', 1;
IF EXISTS (
    SELECT 1 FROM dbo.SystemRole
    WHERE roleID = 2
      AND (roleName COLLATE Latin1_General_100_BIN2 <> 'ICPDP' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH('ICPDP'))
)
    THROW 51003, 'SystemRole ID 2 must be ICPDP.', 1;
IF EXISTS (SELECT 1 FROM dbo.SystemRole WHERE roleName COLLATE Latin1_General_100_CI_AS = 'ICPDP' AND roleID <> 2)
    THROW 51004, 'SystemRole ICPDP already exists under another ID.', 1;
IF EXISTS (
    SELECT 1 FROM dbo.SystemRole
    WHERE roleID = 3
      AND (roleName COLLATE Latin1_General_100_BIN2 <> 'Student' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH('Student'))
)
    THROW 51005, 'SystemRole ID 3 must be Student.', 1;
IF EXISTS (SELECT 1 FROM dbo.SystemRole WHERE roleName COLLATE Latin1_General_100_CI_AS = 'Student' AND roleID <> 3)
    THROW 51006, 'SystemRole Student already exists under another ID.', 1;

SET IDENTITY_INSERT dbo.SystemRole ON;
IF NOT EXISTS (SELECT 1 FROM dbo.SystemRole WHERE roleID = 1)
    INSERT INTO dbo.SystemRole (roleID, roleName, description, isDeleted)
    VALUES (1, N'Admin', N'Quản trị viên cấp cao hệ thống', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.SystemRole WHERE roleID = 2)
    INSERT INTO dbo.SystemRole (roleID, roleName, description, isDeleted)
    VALUES (2, N'ICPDP', N'Cán bộ phòng Phát triển Sinh viên (IC-PDP)', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.SystemRole WHERE roleID = 3)
    INSERT INTO dbo.SystemRole (roleID, roleName, description, isDeleted)
    VALUES (3, N'Student', N'Sinh viên trường Đại học FPT', 0);
SET IDENTITY_INSERT dbo.SystemRole OFF;

UPDATE dbo.SystemRole
SET isDeleted = 0
WHERE roleID IN (1, 2, 3) AND isDeleted = 1;

-- Club roles use IDs directly in authorization and priority logic.
IF EXISTS (
    SELECT 1 FROM dbo.ClubRole
    WHERE clubRoleID = 1
      AND (roleName COLLATE Latin1_General_100_BIN2 <> 'Leader' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH('Leader'))
)
    THROW 51011, 'ClubRole ID 1 must be Leader.', 1;
IF EXISTS (SELECT 1 FROM dbo.ClubRole WHERE roleName COLLATE Latin1_General_100_CI_AS = 'Leader' AND clubRoleID <> 1)
    THROW 51012, 'ClubRole Leader already exists under another ID.', 1;
IF EXISTS (
    SELECT 1 FROM dbo.ClubRole
    WHERE clubRoleID = 2
      AND (roleName COLLATE Latin1_General_100_BIN2 <> 'ViceLeader' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH('ViceLeader'))
)
    THROW 51013, 'ClubRole ID 2 must be ViceLeader.', 1;
IF EXISTS (SELECT 1 FROM dbo.ClubRole WHERE roleName COLLATE Latin1_General_100_CI_AS = 'ViceLeader' AND clubRoleID <> 2)
    THROW 51014, 'ClubRole ViceLeader already exists under another ID.', 1;
IF EXISTS (
    SELECT 1 FROM dbo.ClubRole
    WHERE clubRoleID = 3
      AND (roleName COLLATE Latin1_General_100_BIN2 <> 'Member' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH('Member'))
)
    THROW 51015, 'ClubRole ID 3 must be Member.', 1;
IF EXISTS (SELECT 1 FROM dbo.ClubRole WHERE roleName COLLATE Latin1_General_100_CI_AS = 'Member' AND clubRoleID <> 3)
    THROW 51016, 'ClubRole Member already exists under another ID.', 1;
IF EXISTS (
    SELECT 1 FROM dbo.ClubRole
    WHERE clubRoleID = 5
      AND (roleName COLLATE Latin1_General_100_BIN2 <> 'ClubManager' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH('ClubManager'))
)
    THROW 51017, 'ClubRole ID 5 must be ClubManager.', 1;
IF EXISTS (SELECT 1 FROM dbo.ClubRole WHERE roleName COLLATE Latin1_General_100_CI_AS = 'ClubManager' AND clubRoleID <> 5)
    THROW 51018, 'ClubRole ClubManager already exists under another ID.', 1;

SET IDENTITY_INSERT dbo.ClubRole ON;
IF NOT EXISTS (SELECT 1 FROM dbo.ClubRole WHERE clubRoleID = 1)
    INSERT INTO dbo.ClubRole (clubRoleID, roleName, description, isDeleted)
    VALUES (1, N'Leader', N'Trưởng ban điều hành CLB (Chủ nhiệm)', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.ClubRole WHERE clubRoleID = 2)
    INSERT INTO dbo.ClubRole (clubRoleID, roleName, description, isDeleted)
    VALUES (2, N'ViceLeader', N'Phó ban điều hành CLB (Phó nhiệm)', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.ClubRole WHERE clubRoleID = 3)
    INSERT INTO dbo.ClubRole (clubRoleID, roleName, description, isDeleted)
    VALUES (3, N'Member', N'Thành viên chính thức CLB', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.ClubRole WHERE clubRoleID = 5)
    INSERT INTO dbo.ClubRole (clubRoleID, roleName, description, isDeleted)
    VALUES (5, N'ClubManager', NULL, 0);
SET IDENTITY_INSERT dbo.ClubRole OFF;

UPDATE dbo.ClubRole
SET isDeleted = 0
WHERE clubRoleID IN (1, 2, 3, 5) AND isDeleted = 1;

-- Event role IDs 1-5 preserve the historical FCMS catalog. Runtime attendance
-- authorization resolves CHECK_IN_STAFF by name, so its ID is intentionally
-- allocated by the database when the role is missing.
IF EXISTS (
    SELECT 1
    FROM dbo.EventRole
    WHERE (eventRoleID = 1 AND (roleName COLLATE Latin1_General_100_BIN2 <> N'Trưởng Ban tổ chức' COLLATE Latin1_General_100_BIN2 OR DATALENGTH(roleName) <> DATALENGTH(N'Trưởng Ban tổ chức')))
       OR (eventRoleID = 2 AND (roleName COLLATE Latin1_General_100_BIN2 <> N'Hậu cần' COLLATE Latin1_General_100_BIN2 OR DATALENGTH(roleName) <> DATALENGTH(N'Hậu cần')))
       OR (eventRoleID = 3 AND (roleName COLLATE Latin1_General_100_BIN2 <> N'Truyền thông' COLLATE Latin1_General_100_BIN2 OR DATALENGTH(roleName) <> DATALENGTH(N'Truyền thông')))
       OR (eventRoleID = 4 AND (roleName COLLATE Latin1_General_100_BIN2 <> N'Thủ quỹ' COLLATE Latin1_General_100_BIN2 OR DATALENGTH(roleName) <> DATALENGTH(N'Thủ quỹ')))
       OR (eventRoleID = 5 AND (roleName COLLATE Latin1_General_100_BIN2 <> N'Nội dung' COLLATE Latin1_General_100_BIN2 OR DATALENGTH(roleName) <> DATALENGTH(N'Nội dung')))
)
    THROW 51021, 'An EventRole ID is already assigned to a conflicting name.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.EventRole
    WHERE (roleName COLLATE Latin1_General_100_CI_AS = N'Trưởng Ban tổ chức' AND eventRoleID <> 1)
       OR (roleName COLLATE Latin1_General_100_CI_AS = N'Hậu cần' AND eventRoleID <> 2)
       OR (roleName COLLATE Latin1_General_100_CI_AS = N'Truyền thông' AND eventRoleID <> 3)
       OR (roleName COLLATE Latin1_General_100_CI_AS = N'Thủ quỹ' AND eventRoleID <> 4)
       OR (roleName COLLATE Latin1_General_100_CI_AS = N'Nội dung' AND eventRoleID <> 5)
)
    THROW 51022, 'An EventRole name already exists under a conflicting ID.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.EventRole
    WHERE roleName COLLATE Latin1_General_100_CI_AS = N'CHECK_IN_STAFF'
      AND (roleName COLLATE Latin1_General_100_BIN2 <> N'CHECK_IN_STAFF' COLLATE Latin1_General_100_BIN2
           OR DATALENGTH(roleName) <> DATALENGTH(N'CHECK_IN_STAFF'))
)
    THROW 51023, 'EventRole CHECK_IN_STAFF must use the canonical name.', 1;

SET IDENTITY_INSERT dbo.EventRole ON;
IF NOT EXISTS (SELECT 1 FROM dbo.EventRole WHERE eventRoleID = 1)
    INSERT INTO dbo.EventRole (eventRoleID, roleName, description, isDeleted)
    VALUES (1, N'Trưởng Ban tổ chức', N'Người chịu trách nhiệm chính điều phối sự kiện', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.EventRole WHERE eventRoleID = 2)
    INSERT INTO dbo.EventRole (eventRoleID, roleName, description, isDeleted)
    VALUES (2, N'Hậu cần', N'Phụ trách chuẩn bị cơ sở vật chất, thiết bị', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.EventRole WHERE eventRoleID = 3)
    INSERT INTO dbo.EventRole (eventRoleID, roleName, description, isDeleted)
    VALUES (3, N'Truyền thông', N'Phụ trách quảng bá, viết bài, hình ảnh', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.EventRole WHERE eventRoleID = 4)
    INSERT INTO dbo.EventRole (eventRoleID, roleName, description, isDeleted)
    VALUES (4, N'Thủ quỹ', N'Phụ trách quản lý thu chi, ngân sách sự kiện', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.EventRole WHERE eventRoleID = 5)
    INSERT INTO dbo.EventRole (eventRoleID, roleName, description, isDeleted)
    VALUES (5, N'Nội dung', N'Phụ trách kịch bản, chương trình chi tiết', 0);
SET IDENTITY_INSERT dbo.EventRole OFF;

IF NOT EXISTS (
    SELECT 1 FROM dbo.EventRole
    WHERE roleName COLLATE Latin1_General_100_CI_AS = N'CHECK_IN_STAFF'
)
    INSERT INTO dbo.EventRole (roleName, description, isDeleted)
    VALUES (N'CHECK_IN_STAFF', NULL, 0);

UPDATE dbo.EventRole
SET isDeleted = 0
WHERE (
        eventRoleID IN (1, 2, 3, 4, 5)
        OR roleName COLLATE Latin1_General_100_CI_AS = N'CHECK_IN_STAFF'
      )
  AND isDeleted = 1;
-- Baseline migrations intentionally contain no rows, so reintroduce only
-- mandatory application configuration. Never overwrite administrator values.
INSERT INTO dbo.SystemConfig (configKey, configValue, updatedAt, updatedBy)
SELECT required.configKey, required.configValue, SYSDATETIME(), NULL
FROM (VALUES
    ('AI_CONFIDENCE_THRESHOLD', N'0.70'),
    ('RAG_FALLBACK_MESSAGE', N'Xin lỗi, mình chưa tìm thấy thông tin phù hợp trong kho tri thức để trả lời câu hỏi này. Bạn vui lòng liên hệ ICPDP hoặc Ban chủ nhiệm CLB để được hỗ trợ trực tiếp.'),
    ('BASE_POINTS_ATTENDEE', N'20'),
    ('EVENT_SUBMISSION_MAX_ATTEMPTS', N'3'),
    ('EVENT_SUBMISSION_COOLDOWN_HOURS', N'24'),
    ('club.dashboard.kpi.weights', N'eventCompletion=25;activeMember=20;attendance=20;reportOnTime=15;contribution=10;compliance=10'),
    ('club.dashboard.decision.rules', N'continueMin=80;improvementMin=60;warningMin=40;criticalWarningDecision=Suspend'),
    ('club.dashboard.thresholds', N'minimumMembers=5;reportDeadlineDays=5;lowContributionScore=50;lowAttendanceRate=50;lowAiConfidence=0.60')
) AS required(configKey, configValue)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.SystemConfig existing
    WHERE existing.configKey = required.configKey
);

IF EXISTS (
    SELECT 1
    FROM dbo.SystemConfig
    WHERE configKey = 'AI_CONFIDENCE_THRESHOLD'
      AND (
          TRY_CONVERT(DECIMAL(5, 4), configValue) IS NULL
          OR TRY_CONVERT(DECIMAL(5, 4), configValue) <= 0
          OR TRY_CONVERT(DECIMAL(5, 4), configValue) > 1
      )
)
    THROW 51031, 'AI_CONFIDENCE_THRESHOLD must be a number in (0, 1].', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.SystemConfig
    WHERE configKey = 'RAG_FALLBACK_MESSAGE'
      AND NULLIF(LTRIM(RTRIM(configValue)), N'') IS NULL
)
    THROW 51032, 'RAG_FALLBACK_MESSAGE must not be blank.', 1;