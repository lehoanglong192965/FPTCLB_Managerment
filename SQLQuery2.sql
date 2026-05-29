-- ====================================================================
-- HỆ THỐNG QUẢN LÝ CÂU LẠC BỘ SINH VIÊN (FCMS)
-- FPTU CLUB MANAGEMENT SYSTEM — DATABASE DDL (MÃ NGUỒN HOÀN CHỈNH)
-- Target: Microsoft SQL Server | Chuẩn hóa: 3NF | Tổng số bảng: 23
-- Đã đồng bộ 100% với tài liệu Business Rules phiên bản 2.0
-- ====================================================================

-- TẠO CƠ SỞ DỮ LIỆU TỰ ĐỘNG
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'FPTUCLUB')
BEGIN
    CREATE DATABASE FPTUCLUB;
END
GO
USE FPTUCLUB;
GO

-- ====================================================================
-- PHẦN 1: BẢNG THAM CHIẾU (LOOKUP TABLES)
-- ====================================================================

-- 1.1 Vai trò hệ thống (phân quyền toàn cục)
CREATE TABLE SystemRole (
    roleID        INT IDENTITY(1,1) PRIMARY KEY,
    roleName      VARCHAR(30)   NOT NULL UNIQUE,  -- Admin | ICPDP | Student
    description   NVARCHAR(200) NULL,
    isDeleted     BIT NOT NULL DEFAULT 0
);
GO

-- 1.2 Vai trò trong CLB (phân quyền cấp CLB theo kỳ)
CREATE TABLE ClubRole (
    clubRoleID    INT IDENTITY(1,1) PRIMARY KEY,
    roleName      VARCHAR(30)   NOT NULL UNIQUE,  -- Leader | ViceLeader | Member
    description   NVARCHAR(200) NULL,
    isDeleted     BIT NOT NULL DEFAULT 0
);
GO

-- 1.3 Vai trò trong Ban tổ chức Sự kiện (Trách nhiệm của thành viên trong sự kiện)
CREATE TABLE EventRole (
    eventRoleID   INT IDENTITY(1,1) PRIMARY KEY,
    roleName      NVARCHAR(50)  NOT NULL UNIQUE, -- Trưởng Ban tổ chức | Hậu cần | Truyền thông | Thủ quỹ | Nội dung
    description   NVARCHAR(200) NULL,
    isDeleted     BIT           NOT NULL DEFAULT 0
);
GO

-- ====================================================================
-- PHẦN 2: PHÂN HỆ TÀI KHOẢN & NHÂN SỰ NỀN TẢNG
-- ====================================================================

-- 2.1 Tài khoản người dùng (Sinh viên, Cán bộ)
CREATE TABLE UserAccount (
    userID        INT IDENTITY(1,1) PRIMARY KEY,
    roleID        INT           NOT NULL,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    fullName      NVARCHAR(100) NOT NULL,
    major         NVARCHAR(100) NULL,
    accountStatus VARCHAR(20)   NOT NULL DEFAULT 'Active', -- Active | Suspended
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_User_SystemRole FOREIGN KEY (roleID) REFERENCES SystemRole(roleID),
    CONSTRAINT CK_User_FPT_Email CHECK (email LIKE '%@fpt.edu.vn' OR email LIKE '%@fe.edu.vn')
);
GO

-- 2.2 Học kỳ học thuật (Chu kỳ vận hành của toàn hệ thống)
CREATE TABLE Semester (
    semesterID       INT IDENTITY(1,1) PRIMARY KEY,
    semesterCode     VARCHAR(10)   NOT NULL UNIQUE, -- SP26 | SU26 | FA26
    startDate        DATE          NOT NULL,
    endDate          DATE          NOT NULL,
    isActive         BIT           NOT NULL DEFAULT 0, -- 1: Hiện tại | 0: Quá khứ/Tương lai
    isDeleted        BIT           NOT NULL DEFAULT 0,
    CONSTRAINT CK_Semester_Dates CHECK (endDate >= startDate)
);
GO

-- Ràng buộc loại trừ: Đảm bảo toàn hệ thống tại một thời điểm chỉ có tối đa 1 học kỳ Active
CREATE UNIQUE NONCLUSTERED INDEX UX_Semester_OneActive
ON Semester(isActive)
WHERE isActive = 1 AND isDeleted = 0;
GO

-- 2.3 Cấu hình hệ thống (Tham số động đồng bộ cho các Business Rules)
CREATE TABLE SystemConfig (
    configID      INT IDENTITY(1,1) PRIMARY KEY,
    configKey     VARCHAR(50)   NOT NULL UNIQUE,
    configValue   VARCHAR(100)  NOT NULL,
    updatedAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    updatedBy     INT           NULL,
    CONSTRAINT FK_Config_User FOREIGN KEY (updatedBy) REFERENCES UserAccount(userID)
);
GO

-- 2.4 Nhật ký kỷ luật sinh viên (Dùng để kiểm soát không cho làm Leader khi có án kỷ luật Active - Tuần 2)
CREATE TABLE DisciplineLog (
    disciplineID      INT IDENTITY(1,1) PRIMARY KEY,
    userID            INT NOT NULL,
    semesterID        INT NOT NULL,
    reason            NVARCHAR(500) NOT NULL,
    disciplineStatus  VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active | Expired
    createdAt         DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Discipline_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT FK_Discipline_Semester FOREIGN KEY (semesterID) REFERENCES Semester(semesterID),
    CONSTRAINT CK_Discipline_Status CHECK (disciplineStatus IN ('Active', 'Expired'))
);
GO
CREATE NONCLUSTERED INDEX IX_DisciplineLog_User_Semester ON DisciplineLog(userID, semesterID);
GO

-- ====================================================================
-- PHẦN 3: PHÂN HỆ QUẢN LÝ CÂU LẠC BỘ (CLB)
-- ====================================================================

-- 3.1 Thông tin định danh của Câu lạc bộ
CREATE TABLE Club (
    clubID        INT IDENTITY(1,1) PRIMARY KEY,
    clubCode      VARCHAR(20)   NOT NULL UNIQUE, -- ví dụ: F-Code, JS, EVILA
    clubName      NVARCHAR(100) NOT NULL,
    description   NVARCHAR(MAX) NULL,
    applicationFormQuestions NVARCHAR(MAX) NULL, -- [CẬP NHẬT TUẦN 3]: Lưu cấu trúc câu hỏi động dạng JSON của form tuyển dụng
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT NOT NULL DEFAULT 0
);
GO

-- 3.2 Kho lưu trữ tri thức nội bộ của CLB (Phục vụ AI RAG sync ở Tuần 4 & 5)
CREATE TABLE KnowledgeArchive (
    archiveID     INT IDENTITY(1,1) PRIMARY KEY,
    clubID        INT           NOT NULL,
    title         NVARCHAR(200) NOT NULL,
    content       NVARCHAR(MAX) NOT NULL,
    fileUrl       VARCHAR(500)  NULL,
    uploadedBy    INT           NOT NULL,
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Archive_Club FOREIGN KEY (clubID) REFERENCES Club(clubID),
    CONSTRAINT FK_Archive_User FOREIGN KEY (uploadedBy) REFERENCES UserAccount(userID)
);
GO

-- 3.3 Thành viên Câu lạc bộ theo từng học kỳ (Bảng nối n-n kèm chức vụ)
CREATE TABLE ClubMembership (
    membershipID  INT IDENTITY(1,1) PRIMARY KEY,
    clubID        INT      NOT NULL,
    userID        INT      NOT NULL,
    semesterID    INT      NOT NULL,
    clubRoleID    INT      NOT NULL,
    joinedDate    DATE     NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT      NOT NULL DEFAULT 0,
    CONSTRAINT FK_Membership_Club FOREIGN KEY (clubID) REFERENCES Club(clubID),
    CONSTRAINT FK_Membership_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT FK_Membership_Semester FOREIGN KEY (semesterID) REFERENCES Semester(semesterID),
    CONSTRAINT FK_Membership_ClubRole FOREIGN KEY (clubRoleID) REFERENCES ClubRole(clubRoleID)
);
GO

-- Đảm bảo một sinh viên không thể giữ hai vị trí trùng lặp trong cùng 1 CLB ở cùng 1 kỳ
CREATE UNIQUE NONCLUSTERED INDEX UX_Membership_UniqueStaff
ON ClubMembership(clubID, userID, semesterID)
WHERE isDeleted = 0;
GO

-- Ràng buộc loại trừ nâng cao: Một cá nhân chỉ có thể làm Leader (clubRoleID = 1) duy nhất 1 CLB trong 1 học kỳ
CREATE UNIQUE NONCLUSTERED INDEX UX_Membership_LeaderExclusive
ON ClubMembership(userID, semesterID)
WHERE clubRoleID = 1 AND isDeleted = 0;
GO

-- 3.4 Danh sách đen thành viên cấp CLB (Chặn không cho đăng ký ứng tuyển vào CLB này)
CREATE TABLE ClubBlacklist (
    blacklistID   INT IDENTITY(1,1) PRIMARY KEY,
    clubID        INT           NOT NULL,
    userID        INT           NOT NULL,
    reason        NVARCHAR(500) NULL,
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Blacklist_Club FOREIGN KEY (clubID) REFERENCES Club(clubID),
    CONSTRAINT FK_Blacklist_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT UC_ClubBlacklist UNIQUE (clubID, userID)
);
GO

-- ====================================================================
-- PHẦN 4: PHÂN HỆ QUY TRÌNH TUYỂN DỤNG THÀNH VIÊN MỚI
-- ====================================================================

-- 4.1 Đơn đăng ký ứng tuyển gia nhập CLB của sinh viên
CREATE TABLE RecruitmentApplication (
    applicationID INT IDENTITY(1,1) PRIMARY KEY,
    clubID        INT           NOT NULL,
    userID        INT           NOT NULL,
    semesterID    INT           NOT NULL,
    cvUrl         VARCHAR(500)  NULL,
    introduction  NVARCHAR(MAX) NULL,
    answersJson   NVARCHAR(MAX) NULL,                       -- [CẬP NHẬT TUẦN 3]: Lưu trữ câu trả lời cho form câu hỏi động
    status        VARCHAR(20)   NOT NULL DEFAULT 'Draft',   -- [CẬP NHẬT TUẦN 3]: Mặc định ban đầu là đơn Nháp (Draft)
    aiScore       DECIMAL(5,2)  NULL,                       
    aiFeedback    NVARCHAR(MAX) NULL,                       
    submittedAt   DATETIME      NULL,                       -- [CẬP NHẬT TUẦN 3]: Ngày nộp chính thức để tính mốc thời gian xóa nháp quá 7 ngày
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Recruit_Club FOREIGN KEY (clubID) REFERENCES Club(clubID),
    CONSTRAINT FK_Recruit_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT FK_Recruit_Semester FOREIGN KEY (semesterID) REFERENCES Semester(semesterID),
    -- [CẬP NHẬT TUẦN 3]: Bổ sung trạng thái Draft và Withdrawn vào Check Constraint
    CONSTRAINT CK_Recruit_Status CHECK (status IN ('Draft', 'Pending', 'Interviewing', 'Passed', 'Rejected', 'Withdrawn'))
);
GO

-- Chặn không cho nộp nhiều đơn trùng lặp vào cùng 1 CLB trong cùng kỳ nếu đơn cũ đang hoạt động
CREATE UNIQUE NONCLUSTERED INDEX UX_Recruit_OnePerPeriod
ON RecruitmentApplication(clubID, userID, semesterID)
WHERE isDeleted = 0;
GO

-- 4.2 Lịch phỏng vấn tuyển dụng thành viên mới
CREATE TABLE InterviewSchedule (
    interviewID   INT IDENTITY(1,1) PRIMARY KEY,
    applicationID INT           NOT NULL,
    scheduledTime DATETIME      NOT NULL,
    location      NVARCHAR(200) NOT NULL, -- Phòng học, link Meet/Zoom
    status        VARCHAR(20)   NOT NULL DEFAULT 'Scheduled', -- Scheduled | Completed | Cancelled
    result        VARCHAR(20)   NULL, -- Passed | Failed
    notes         NVARCHAR(MAX) NULL, -- Nhận xét chung
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Interview_Recruit FOREIGN KEY (applicationID) REFERENCES RecruitmentApplication(applicationID),
    CONSTRAINT CK_Interview_Status CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    CONSTRAINT CK_Interview_Result CHECK (result IN ('Passed', 'Failed'))
);
GO

-- 4.3 Phân công người phỏng vấn (Bảng nối n-n giữa lịch phỏng vấn và thành viên phỏng vấn)
CREATE TABLE InterviewerAssignment (
    assignmentID  INT IDENTITY(1,1) PRIMARY KEY,
    interviewID   INT           NOT NULL,
    interviewerID INT           NOT NULL, -- Người thực hiện phỏng vấn (UserAccount)
    evaluation    NVARCHAR(MAX) NULL,     -- Nhận xét đánh giá riêng của người này
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Interviewer_Schedule FOREIGN KEY (interviewID) REFERENCES InterviewSchedule(interviewID),
    CONSTRAINT FK_Interviewer_Account FOREIGN KEY (interviewerID) REFERENCES UserAccount(userID),
    CONSTRAINT UC_Interviewer_Schedule UNIQUE (interviewID, interviewerID)
);
GO

-- ====================================================================
-- PHẦN 5: PHÂN HỆ QUẢN LÝ SỰ KIỆN & HOẠT ĐỘNG
-- ====================================================================

-- 5.1 Thông tin sự kiện do CLB tổ chức
CREATE TABLE Event (
    eventID       INT IDENTITY(1,1) PRIMARY KEY,
    clubID        INT           NOT NULL,
    semesterID    INT           NOT NULL,
    eventCode     VARCHAR(30)   NOT NULL UNIQUE,
    eventName     NVARCHAR(150) NOT NULL,
    description   NVARCHAR(MAX) NULL,
    location      NVARCHAR(200) NOT NULL DEFAULT N'FPTU Campus', -- [CẬP NHẬT TUẦN 5]: Địa điểm để check trùng lịch 409
    budget        DECIMAL(18,2) NOT NULL DEFAULT 0, 
    startDate     DATETIME      NOT NULL,
    endDate       DATETIME      NOT NULL,
    eventStatus   VARCHAR(20)   NOT NULL DEFAULT 'Draft', 
    isResubmitted BIT           NOT NULL DEFAULT 0,              -- [CẬP NHẬT TUẦN 5]: Đánh dấu đơn đề xuất nộp lại (Áp dụng luật cách 7 ngày)
    isScoreLocked BIT           NOT NULL DEFAULT 0,              -- [CẬP NHẬT TUẦN 6]: Khóa điểm tự động, chặn Admin đóng kỳ bừa bãi
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Event_Club FOREIGN KEY (clubID) REFERENCES Club(clubID),
    CONSTRAINT FK_Event_Semester FOREIGN KEY (semesterID) REFERENCES Semester(semesterID),
    CONSTRAINT CK_Event_Duration CHECK (endDate >= startDate),
    CONSTRAINT CK_Event_Budget CHECK (budget >= 0),
    CONSTRAINT CK_Event_Status CHECK (eventStatus IN ('Draft', 'Pending', 'Approved', 'Reported', 'Closed'))
);
GO

-- 5.2 Phân công nhiệm vụ Ban tổ chức (BTC) sự kiện
CREATE TABLE EventAssignment (
    assignmentID  INT IDENTITY(1,1) PRIMARY KEY,
    eventID       INT           NOT NULL,
    userID        INT           NOT NULL,
    eventRoleID   INT           NOT NULL, -- Liên kết đến danh mục EventRole
    assignedAt    DATETIME      NOT NULL DEFAULT GETDATE(),
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Assign_Event FOREIGN KEY (eventID) REFERENCES Event(eventID),
    CONSTRAINT FK_Assign_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT FK_Assign_EventRole FOREIGN KEY (eventRoleID) REFERENCES EventRole(eventRoleID)
);
GO

-- Chặn trùng lặp nhân sự trong cùng một đầu việc của sự kiện
CREATE UNIQUE NONCLUSTERED INDEX UX_Event_Staffing
ON EventAssignment(eventID, userID)
WHERE isDeleted = 0;
GO

-- 5.3 Đăng ký tham gia sự kiện (Dành cho thành viên đại chúng hoặc người tham dự ngoài BTC)
CREATE TABLE EventRegistration (
    registrationID INT IDENTITY(1,1) PRIMARY KEY,
    eventID        INT           NOT NULL,
    userID         INT           NOT NULL,
    registeredAt   DATETIME      NOT NULL DEFAULT GETDATE(),
    status         VARCHAR(20)   NOT NULL DEFAULT 'Registered', -- Registered | Cancelled
    CONSTRAINT FK_Registration_Event FOREIGN KEY (eventID) REFERENCES Event(eventID),
    CONSTRAINT FK_Registration_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT CK_Registration_Status CHECK (status IN ('Registered', 'Cancelled')),
    CONSTRAINT UC_EventRegistration UNIQUE (eventID, userID)
);
GO

-- ====================================================================
-- PHẦN 6: PHÂN HỆ ĐIỂM DANH (ATTENDANCE) & MINH CHỨNG
-- ====================================================================

-- 6.1 Lịch trình điểm danh chi tiết của sự kiện (Theo phiên/ngày)
CREATE TABLE AttendanceSession (
    sessionID     INT IDENTITY(1,1) PRIMARY KEY,
    eventID       INT           NOT NULL,
    sessionName   NVARCHAR(100) NOT NULL, 
    checkInTime   DATETIME      NOT NULL,
    evidenceProofUrl VARCHAR(500) NULL,   -- [CẬP NHẬT TUẦN 6]: Ảnh minh chứng toàn phiên bắt buộc khi xuất/nhập dữ liệu điểm danh
    isDeleted     BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Session_Event FOREIGN KEY (eventID) REFERENCES Event(eventID)
);
GO

-- 6.2 Bảng dữ liệu điểm danh thực tế kèm kiểm chuẩn AI bằng hình ảnh
CREATE TABLE AttendanceRecord (
    recordID      INT IDENTITY(1,1) PRIMARY KEY,
    sessionID     INT          NOT NULL,
    userID        INT          NOT NULL,
    attendanceStatus VARCHAR(20) NOT NULL DEFAULT 'Absent', 
    capturedImgUrl   VARCHAR(500) NULL,                  
    aiMatchConfidence DECIMAL(5,2) NULL,                 
    isVerifiedByAI   BIT          NOT NULL DEFAULT 0,    
    markedAt         DATETIME     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Record_Session FOREIGN KEY (sessionID) REFERENCES AttendanceSession(sessionID),
    CONSTRAINT FK_Record_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT CK_Record_Status CHECK (attendanceStatus IN ('Present', 'Absent', 'Late'))
);
GO

-- Biến một cặp (Phiên, Sinh viên) thành duy nhất để tránh điểm danh trùng
CREATE UNIQUE NONCLUSTERED INDEX UX_Attendance_OneEntry
ON AttendanceRecord(sessionID, userID);
GO

-- ====================================================================
-- PHẦN 7: PHÂN HỆ THI ĐUANH & ĐÁNH GIÁ HIỆU SUẤT (PERFORMANCE)
-- ====================================================================

-- 7.1 Điểm số hiệu suất thành viên tích lũy qua từng sự kiện
CREATE TABLE MemberPerformance (
    performanceID INT IDENTITY(1,1) PRIMARY KEY,
    eventID       INT          NOT NULL,
    userID        INT          NOT NULL,
    clubID        INT          NOT NULL,
    basePoints    INT          NOT NULL DEFAULT 0, 
    bonusPoints   INT          NOT NULL DEFAULT 0, 
    penaltyPoints INT          NOT NULL DEFAULT 0, 
    finalPoints   AS (basePoints + bonusPoints - penaltyPoints) PERSISTED, 
    leaderEvaluation NVARCHAR(MAX) NULL,           
    updatedAt     DATETIME     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Perf_Event FOREIGN KEY (eventID) REFERENCES Event(eventID),
    CONSTRAINT FK_Perf_User FOREIGN KEY (userID) REFERENCES UserAccount(userID),
    CONSTRAINT FK_Perf_Club FOREIGN KEY (clubID) REFERENCES Club(clubID),
    CONSTRAINT CK_Perf_FinalLimit CHECK (basePoints + bonusPoints - penaltyPoints >= -1000) 
);
GO

-- Mỗi sinh viên chỉ có một bảng điểm duy nhất cho một sự kiện cụ thể
CREATE UNIQUE NONCLUSTERED INDEX UX_Performance_SingleSheet
ON MemberPerformance(eventID, userID);
GO

-- 7.2 Bảng tổng hợp điểm số thi đua CLB theo từng Học kỳ (Phục vụ Leaderboard xếp hạng Tuần 6)
CREATE TABLE ClubKPI (
    kpiID             INT IDENTITY(1,1) PRIMARY KEY,
    clubID            INT NOT NULL,
    semesterID        INT NOT NULL,
    totalEventsHeld   INT NOT NULL DEFAULT 0,
    totalMembers      INT NOT NULL DEFAULT 0,
    kpiScore          DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    rankingTier       VARCHAR(5) NULL, 
    updatedAt         DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_ClubKPI_Club FOREIGN KEY (clubID) REFERENCES Club(clubID),
    CONSTRAINT FK_ClubKPI_Semester FOREIGN KEY (semesterID) REFERENCES Semester(semesterID),
    CONSTRAINT UC_ClubKPI UNIQUE (clubID, semesterID),
    CONSTRAINT CK_ClubKPI_Score CHECK (kpiScore >= 0)
);
GO

-- ====================================================================
-- PHẦN 8: PHÂN HỆ NHẬT KÝ TRUY VẤN AI VÀ TRỢ LÝ THÔNG MINH
-- ====================================================================

-- 8.1 Nhật ký hội thoại Chatbot AI (Tư vấn tuyển dụng, Hỏi đáp quy chế)
CREATE TABLE AIChatAuditLog (
    chatLogID     INT IDENTITY(1,1) PRIMARY KEY,
    userID        INT           NULL, 
    userPrompt    NVARCHAR(MAX) NOT NULL,
    aiResponse    NVARCHAR(MAX) NOT NULL,
    intentMatched VARCHAR(50)   NULL, 
    tokensUsed    INT           NOT NULL DEFAULT 0,
    createdAt     DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_AIChat_User FOREIGN KEY (userID) REFERENCES UserAccount(userID)
);
GO

-- ====================================================================
-- PHẦN 9: PHÂN HỆ AN TOÀN HỆ THỐNG & KIỂM TOÁN (AUDIT LOGS)
-- ====================================================================

-- 9.1 Nhật ký ghi vết toàn bộ thao tác nhạy cảm (Ghi đè luật, duyệt ngân sách lớn)
CREATE TABLE AuditLog (
    logID         INT IDENTITY(1,1) PRIMARY KEY,
    actorID       INT           NOT NULL,          
    actionType    VARCHAR(50)   NOT NULL,          
    tableName     VARCHAR(50)   NOT NULL,          
    recordID      INT           NOT NULL,          
    oldValue      NVARCHAR(MAX) NULL,              
    newValue      NVARCHAR(MAX) NULL,              
    overrideReason NVARCHAR(MAX) NOT NULL,         
    executedAt    DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Audit_Actor FOREIGN KEY (actorID) REFERENCES UserAccount(userID)
);
GO

-- ====================================================================
-- PHẦN 10: DỮ LIỆU KHỞI TẠO MẶC ĐỊNH (SEED DATA NỀN TẢNG THIẾT YẾU)
-- ====================================================================

-- 10.1 Khởi tạo phân quyền hệ thống toàn cục
SET IDENTITY_INSERT SystemRole ON;
INSERT INTO SystemRole (roleID, roleName, description)
VALUES
    (1, 'Admin',   N'Quản trị viên cấp cao hệ thống'),
    (2, 'ICPDP',   N'Cán bộ phòng Phát triển Sinh viên (IC-PDP)'),
    (3, 'Student', N'Sinh viên trường Đại học FPT');
SET IDENTITY_INSERT SystemRole OFF;
GO

-- 10.2 Khởi tạo vai trò bên trong Câu lạc bộ
SET IDENTITY_INSERT ClubRole ON;
INSERT INTO ClubRole (clubRoleID, roleName, description)
VALUES
    (1, 'Leader',     N'Trưởng ban điều hành CLB (Chủ nhiệm)'),
    (2, 'ViceLeader', N'Phó ban điều hành CLB (Phó nhiệm)'),
    (3, 'Member',     N'Thành viên chính thức CLB');
SET IDENTITY_INSERT ClubRole OFF;
GO

-- 10.2.2 Khởi tạo vai trò trong Ban tổ chức Sự kiện
SET IDENTITY_INSERT EventRole ON;
INSERT INTO EventRole (eventRoleID, roleName, description)
VALUES
    (1, N'Trưởng Ban tổ chức', N'Người chịu trách nhiệm chính điều phối sự kiện'),
    (2, N'Hậu cần',             N'Phụ trách chuẩn bị cơ sở vật chất, thiết bị'),
    (3, N'Truyền thông',         N'Phụ trách quảng bá, viết bài, hình ảnh'),
    (4, N'Thủ quỹ',             N'Phụ trách quản lý thu chi, ngân sách sự kiện'),
    (5, N'Nội dung',            N'Phụ trách kịch bản, chương trình chi tiết');
SET IDENTITY_INSERT EventRole OFF;
GO

-- 10.3 Khởi tạo học kỳ học thuật mẫu (Seed Data cho Semester)
SET IDENTITY_INSERT Semester ON;
INSERT INTO Semester (semesterID, semesterCode, startDate, endDate, isActive, isDeleted)
VALUES
    (1, 'SP26', '2026-01-01', '2026-04-30', 0, 0),
    (2, 'SU26', '2026-05-01', '2026-08-31', 1, 0), 
    (3, 'FA26', '2026-09-01', '2026-12-31', 0, 0);
SET IDENTITY_INSERT Semester OFF;
GO

-- 10.4 Khởi tạo tài khoản hệ thống mặc định
SET IDENTITY_INSERT UserAccount ON;
INSERT INTO UserAccount (userID, roleID, email, fullName, major, accountStatus)
VALUES
    (1, 1, 'admin@fpt.edu.vn',       'System Administrator',  'Software Engineering', 'Active'),
    (2, 2, 'pdp.manager@fpt.edu.vn', 'IC-PDP Manager Office', NULL,                   'Active');
SET IDENTITY_INSERT UserAccount OFF;
GO

-- 10.5 Cấu hình các hằng số nghiệp vụ ban đầu theo quy tắc Business Rules
INSERT INTO SystemConfig (configKey, configValue, updatedBy)
VALUES
    ('AI_CONFIDENCE_THRESHOLD',      '0.70', 1),  
    ('MAX_CLUBS_PER_STUDENT',        '4',    1),  
    ('BASE_POINTS_ORGANIZER',        '50',   1),  
    ('BASE_POINTS_ATTENDEE',         '20',   1),  
    ('MAX_BONUS_POINTS_LIMIT',       '30',   1);  
GO

PRINT '==== SYSTEM LOG: DATABASE FPTUCLUB HAS BEEN INITIALIZED AND UPDATED SUCCESSFULLY FOR ALL WEEKS ====';
GO