<!-- Generated: 2026-06-08 | Files scanned: 24 | Token estimate: ~800 -->

# Sơ đồ Cơ sở Dữ liệu

## Entities Chính
- `UserAccount`: Bảng trung tâm quản lý người dùng (email, mã SV, accountStatus). *Sắp có thêm `phoneNumber`, `studentCardUrl`.*
- `SystemRole`: Chứa role hệ thống (ADMIN, ICPDP, MEMBER).
- `Club`: Thông tin Câu lạc bộ.
- `Event`: Thông tin Sự kiện.

## Entities Chức năng & Quan hệ
- `ClubMembership`: Bảng trung gian `UserAccount` N - N `Club`, chứa `ClubRole` (Leader, Member, v.v.).
- `RecruitmentApplication`: Đơn xin vào CLB của sinh viên.
- `InterviewSchedule` & `InterviewerAssignment`: Quản lý phỏng vấn tân binh.
- `EventRegistration`: Sinh viên đăng ký tham gia sự kiện.
- `EventAssignment`: Phân công nhiệm vụ trong sự kiện.
- `DisciplineLog`, `WithdrawLog`, `ClubBlacklist`: Quản lý kỷ luật và rời CLB.
- `ClubKPI`, `MemberPerformance`: Đánh giá hoạt động.
- `AttendanceSession`, `AttendanceRecord`: Điểm danh.
- `Semester`: Quản lý kỳ học (Spring, Summer, Fall).
- `AuditLog`, `AIChatAuditLog`: Lưu vết hệ thống.

## Quy tắc Nghiệp vụ Dữ liệu (Hibernate)
- Soft Delete: Các Entity sử dụng `@SQLRestriction("isDeleted = false")` để không xóa cứng dữ liệu.
- Auto DDL: Backend đang dùng `ddl-auto: validate` để kiểm tra cấu trúc DB lúc chạy (Cần DB phải chuẩn bị sẵn cấu trúc từ trước).
